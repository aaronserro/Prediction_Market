package com.betting.backend.trades;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.betting.backend.markets.Market;
import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.MarketStatus;
import com.betting.backend.markets.Outcome;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.positions.PositionService;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Service.WalletService;

class TradeServiceTest {

    private TradeRepo trades;
    private OutcomeRepository outcomes;
    private MarketRepository markets;
    private PositionService positions;
    private PricingService pricing;
    private WalletService wallets;
    private TradeServiceImpl service;

    @BeforeEach
    void setUp() {
        trades = mock(TradeRepo.class);
        outcomes = mock(OutcomeRepository.class);
        markets = mock(MarketRepository.class);
        positions = mock(PositionService.class);
        pricing = mock(PricingService.class);
        wallets = mock(WalletService.class);
        service = new TradeServiceImpl(trades, outcomes, markets, positions, pricing, wallets);
    }

    @Test
    void boundaryQuantitiesReachMarketValidation() {
        User user = user();
        CreateTradeRequest minimum = request(1);
        CreateTradeRequest maximum = request(TradeLimits.MAX_QUANTITY);

        assertThatThrownBy(() -> service.createBuyTrade(minimum, user, "buy-min"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Market not found");
        assertThatThrownBy(() -> service.createSellTrade(maximum, user, "sell-max"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Market not found");
    }

    @Test
    void invalidQuantitiesFailBeforeAnyDependencyInteraction() {
        User user = user();

        for (int quantity : new int[] {-1, 0, TradeLimits.MAX_QUANTITY + 1}) {
            assertThatThrownBy(() -> service.createBuyTrade(
                    request(quantity), user, "buy-" + quantity))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Quantity must be between 1 and 10000");
        }

        verifyNoInteractions(trades, outcomes, markets, positions, pricing, wallets);
    }

    @Test
    void outstandingOverflowAbortsBeforeTradeIsSaved() {
        User user = user();
        CreateTradeRequest request = request(1);
        Market market = activeMarket(request.getMarketId());
        Outcome outcome = new Outcome();
        outcome.setId(request.getOutcomeId());
        outcome.setMarket(market);
        outcome.incremementOutstanding(Integer.MAX_VALUE);

        when(markets.findByIdForUpdate(request.getMarketId())).thenReturn(Optional.of(market));
        when(outcomes.findById(request.getOutcomeId())).thenReturn(Optional.of(outcome));
        when(pricing.quoteBuyCost(request.getMarketId(), request.getOutcomeId(), 1)).thenReturn(50L);

        assertThatThrownBy(() -> service.createBuyTrade(request, user, "overflow"))
                .isInstanceOf(ArithmeticException.class);

        verify(trades, never()).saveAndFlush(any(Trade.class));
        verify(positions, never()).applyBuy(any(), any(), any(Integer.class), any(Long.class));
    }

    private static CreateTradeRequest request(int quantity) {
        CreateTradeRequest request = new CreateTradeRequest();
        request.setMarketId(UUID.randomUUID());
        request.setOutcomeId(UUID.randomUUID());
        request.setQuantity(quantity);
        return request;
    }

    private static User user() {
        User user = new User();
        user.setId(7L);
        user.setUsername("alice");
        user.setRoles(Set.of("ROLE_USER"));
        return user;
    }

    private static Market activeMarket(UUID id) {
        Market market = new Market();
        market.setId(id);
        market.setStatus(MarketStatus.ACTIVE);
        market.setEndDate(LocalDateTime.now().plusDays(1));
        return market;
    }
}
