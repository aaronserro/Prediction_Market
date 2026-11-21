package com.betting.backend.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.markets.Market;
import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.MarketStatus;
import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.positions.PositionService;
import com.betting.backend.trades.Trade;
import com.betting.backend.trades.TradeController;
import com.betting.backend.trades.TradeRepo;
import com.betting.backend.trades.TradeService;
import com.betting.backend.trades.TradeServiceImpl;
import com.betting.backend.trades.TradeSide;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Controller.FundRequestController;
import com.betting.backend.wallet.Controller.WalletController;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Service.WalletTransactionService;
import com.betting.backend.wallet.dto.DepositRequest;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.TransferRequest;
import com.betting.backend.wallet.dto.WithdrawRequest;

class MutationIdempotencyTest {

    private final IdempotencyKeyFactory keys = new IdempotencyKeyFactory();

    @Test
    void scopedKeyIsBoundedHashedAndSeparatedByActorAndOperation() {
        String first = keys.requireAndScope("wallet-withdraw", 10L, " client-key ");
        String same = keys.requireAndScope("wallet-withdraw", 10L, "client-key");
        String otherActor = keys.requireAndScope("wallet-withdraw", 11L, "client-key");
        String otherOperation = keys.requireAndScope("wallet-transfer", 10L, "client-key");

        assertThat(first).isEqualTo(same)
                .startsWith("idem:v1:wallet-withdraw:")
                .doesNotContain("client-key")
                .hasSizeLessThanOrEqualTo(128);
        assertThat(otherActor).isNotEqualTo(first);
        assertThat(otherOperation).isNotEqualTo(first);
        assertThatThrownBy(() -> keys.requireAndScope("wallet-withdraw", 10L, "x".repeat(129)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("128");
    }

    @Test
    void walletFundRequestAndTradeCommandsRejectMissingKeys() {
        WalletService wallet = mock(WalletService.class);
        FinancialRateLimiter limiter = mock(FinancialRateLimiter.class);
        WalletController walletController = new WalletController(
                wallet, mock(WalletTransactionService.class), limiter, keys,
                mock(AuditService.class));
        FundRequestServiceImpl fundRequests = mock(FundRequestServiceImpl.class);
        FundRequestController fundController = new FundRequestController(
                fundRequests, limiter, keys, mock(AuditService.class));
        UserRepository users = mock(UserRepository.class);
        TradeService trades = mock(TradeService.class);
        TradeController tradeController = new TradeController(
                trades, users, limiter, keys, mock(AuditService.class),
                mock(PublicReadRateLimiter.class));
        User user = user(10L);
        User admin = user(99L);
        when(users.findByUsername("alice")).thenReturn(Optional.of(user));
        Principal principal = () -> "alice";
        CreateTradeRequest trade = tradeRequest(UUID.randomUUID(), UUID.randomUUID(), 2);
        FundRequestCreateRequest fund = new FundRequestCreateRequest();
        fund.setAmountCents(100L);
        fund.setReason("test");

        assertThatThrownBy(() -> walletController.withdraw(
                10L, new WithdrawRequest(100L, "withdraw"), null, user))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> walletController.deposit(
                10L, new DepositRequest(100L, "deposit"), null, admin))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> walletController.transfer(
                10L, 11L, new TransferRequest(1L, 2L, 100L, "transfer"), null, user))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> fundController.createFundRequest(10L, fund, null, 10L))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> tradeController.createBuyTrade(trade, null, principal))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> tradeController.createSellTrade(trade, " ", principal))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(wallet, fundRequests, trades);
    }

    @Test
    void identicalTradeRetryReplaysWithoutAnotherMutation() {
        TradeFixture fixture = new TradeFixture();
        Trade existing = fixture.trade(TradeSide.BUY, 2, "trade-key");
        when(fixture.trades.findByIdempotencyKey("trade-key")).thenReturn(Optional.of(existing));

        TradeResponse response = fixture.service.createBuyTrade(
                fixture.request(2), fixture.user, "trade-key");

        assertThat(response.getId()).isEqualTo(existing.getId());
        verifyNoInteractions(fixture.wallet, fixture.positions);
        verify(fixture.trades, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void changedTradeIntentWithSameKeyIsRejected() {
        TradeFixture fixture = new TradeFixture();
        Trade existing = fixture.trade(TradeSide.BUY, 2, "trade-key");
        when(fixture.trades.findByIdempotencyKey("trade-key")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> fixture.service.createBuyTrade(
                fixture.request(3), fixture.user, "trade-key"))
                .isInstanceOf(DuplicateOperationException.class)
                .hasMessageContaining("different trade");

        verifyNoInteractions(fixture.wallet, fixture.positions);
    }

    @Test
    void concurrentRetryObservedAfterMarketLockReplaysWinner() {
        TradeFixture fixture = new TradeFixture();
        Trade winner = fixture.trade(TradeSide.BUY, 2, "trade-key");
        when(fixture.trades.findByIdempotencyKey("trade-key"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winner));
        when(fixture.markets.findByIdForUpdate(fixture.market.getId()))
                .thenReturn(Optional.of(fixture.market));

        TradeResponse response = fixture.service.createBuyTrade(
                fixture.request(2), fixture.user, "trade-key");

        assertThat(response.getId()).isEqualTo(winner.getId());
        verifyNoInteractions(fixture.wallet, fixture.positions);
        verify(fixture.trades, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void newTradePersistsKeyAndUsesDerivedWalletKey() {
        TradeFixture fixture = new TradeFixture();
        when(fixture.trades.findByIdempotencyKey("trade-key")).thenReturn(Optional.empty());
        when(fixture.markets.findByIdForUpdate(fixture.market.getId()))
                .thenReturn(Optional.of(fixture.market));
        when(fixture.outcomes.findById(fixture.outcome.getId()))
                .thenReturn(Optional.of(fixture.outcome));
        when(fixture.pricing.quoteBuyCost(
                fixture.market.getId(), fixture.outcome.getId(), 2)).thenReturn(50L);
        when(fixture.trades.saveAndFlush(org.mockito.ArgumentMatchers.any(Trade.class)))
                .thenAnswer(invocation -> {
                    Trade trade = invocation.getArgument(0);
                    trade.setId(51L);
                    trade.setCreatedAt(LocalDateTime.now());
                    return trade;
                });

        TradeResponse response = fixture.service.createBuyTrade(
                fixture.request(2), fixture.user, "trade-key");

        ArgumentCaptor<Trade> saved = ArgumentCaptor.forClass(Trade.class);
        verify(fixture.trades).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getIdempotencyKey()).isEqualTo("trade-key");
        assertThat(response.getId()).isEqualTo(51L);
        verify(fixture.wallet).debit(
                50L, 10L, "trade-key:wallet",
                "BUY:market=" + fixture.market.getId()
                        + ",outcome=" + fixture.outcome.getId() + ",qty=2");
        verify(fixture.positions).applyBuy(fixture.user, fixture.outcome.getId(), 2, 50L);
    }

    private static User user(Long id) {
        User user = new User();
        user.setId(id);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setRoles(Set.of("ROLE_USER"));
        return user;
    }

    private static CreateTradeRequest tradeRequest(UUID marketId, UUID outcomeId, int quantity) {
        CreateTradeRequest request = new CreateTradeRequest();
        request.setMarketId(marketId);
        request.setOutcomeId(outcomeId);
        request.setQuantity(quantity);
        return request;
    }

    private static final class TradeFixture {
        private final TradeRepo trades = mock(TradeRepo.class);
        private final OutcomeRepository outcomes = mock(OutcomeRepository.class);
        private final MarketRepository markets = mock(MarketRepository.class);
        private final PositionService positions = mock(PositionService.class);
        private final PricingService pricing = mock(PricingService.class);
        private final WalletService wallet = mock(WalletService.class);
        private final TradeServiceImpl service = new TradeServiceImpl(
                trades, outcomes, markets, positions, pricing, wallet);
        private final User user = user(10L);
        private final Market market = market();
        private final Outcome outcome = outcome(market);

        private CreateTradeRequest request(int quantity) {
            return tradeRequest(market.getId(), outcome.getId(), quantity);
        }

        private Trade trade(TradeSide side, int quantity, String key) {
            Trade trade = new Trade();
            trade.setId(50L);
            trade.setCreatedAt(LocalDateTime.now());
            trade.setUser(user);
            trade.setMarket(market);
            trade.setOutcome(outcome);
            trade.setQuantity(quantity);
            trade.setPricePerShare(25);
            trade.setTotalAmount(50L);
            trade.setside(side);
            trade.setIdempotencyKey(key);
            return trade;
        }

        private static Market market() {
            Market market = new Market();
            market.setId(UUID.randomUUID());
            market.setTitle("Test market");
            market.setStatus(MarketStatus.ACTIVE);
            market.setEndDate(LocalDateTime.now().plusDays(1));
            return market;
        }

        private static Outcome outcome(Market market) {
            Outcome outcome = new Outcome();
            outcome.setId(UUID.randomUUID());
            outcome.setLabel("Yes");
            outcome.setMarket(market);
            return outcome;
        }
    }
}
