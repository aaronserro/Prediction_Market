package com.betting.backend.trades;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import com.betting.backend.auth.ratelimit.RateLimitExceededException;
import com.betting.backend.audit.AuditService;
import com.betting.backend.security.IdempotencyKeyFactory;
import com.betting.backend.trades.dto.CreateTradeRequest;
import com.betting.backend.trades.dto.TradeResponse;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;

class TradeControllerRateLimitTest {

    private TradeService tradeService;
    private UserRepository userRepository;
    private FinancialRateLimiter rateLimiter;
    private TradeController controller;
    private CreateTradeRequest request;
    private User user;
    private Principal principal;
    private IdempotencyKeyFactory idempotencyKeys;
    private AuditService auditService;
    private PublicReadRateLimiter publicRateLimiter;

    @BeforeEach
    void setUp() {
        tradeService = mock(TradeService.class);
        userRepository = mock(UserRepository.class);
        rateLimiter = mock(FinancialRateLimiter.class);
        idempotencyKeys = mock(IdempotencyKeyFactory.class);
        auditService = mock(AuditService.class);
        publicRateLimiter = mock(PublicReadRateLimiter.class);
        controller = new TradeController(
            tradeService, userRepository, rateLimiter, idempotencyKeys,
            auditService, publicRateLimiter);

        user = new User();
        user.setId(42L);
        user.setUsername("trader");
        when(userRepository.findByUsername("trader")).thenReturn(Optional.of(user));

        principal = () -> "trader";
        request = new CreateTradeRequest();
        request.setMarketId(UUID.randomUUID());
        request.setOutcomeId(UUID.randomUUID());
        request.setQuantity(2);
        when(idempotencyKeys.requireAndScope("trade-sell", 42L, "client-key"))
            .thenReturn("sell-scoped-key");
        when(idempotencyKeys.requireAndScope("trade-buy", 42L, "client-key"))
            .thenReturn("buy-scoped-key");
    }

    @Test
    void blockedSellDoesNotCreateTrade() {
        doThrow(exceeded()).when(rateLimiter).checkTrade(42L);

        assertThatThrownBy(() -> controller.createSellTrade(request, "client-key", principal))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkTrade(42L);
        verifyNoInteractions(tradeService);
    }

    @Test
    void blockedBuyDoesNotCreateTrade() {
        doThrow(exceeded()).when(rateLimiter).checkTrade(42L);

        assertThatThrownBy(() -> controller.createBuyTrade(request, "client-key", principal))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkTrade(42L);
        verifyNoInteractions(tradeService);
    }

    @Test
    void allowedSellChecksLimitBeforeMutation() {
        when(tradeService.createSellTrade(request, user, "sell-scoped-key"))
            .thenReturn(new TradeResponse());

        controller.createSellTrade(request, "client-key", principal);

        InOrder order = inOrder(rateLimiter, tradeService);
        order.verify(rateLimiter).checkTrade(42L);
        order.verify(tradeService).createSellTrade(request, user, "sell-scoped-key");
        verify(auditService).success(42L, "TRADE_SELL", "TRADE", null);
    }

    @Test
    void allowedBuyChecksLimitBeforeMutation() {
        when(tradeService.createBuyTrade(request, user, "buy-scoped-key"))
            .thenReturn(new TradeResponse());

        controller.createBuyTrade(request, "client-key", principal);

        InOrder order = inOrder(rateLimiter, tradeService);
        order.verify(rateLimiter).checkTrade(42L);
        order.verify(tradeService).createBuyTrade(request, user, "buy-scoped-key");
        verify(auditService).success(42L, "TRADE_BUY", "TRADE", null);
    }

    @Test
    void authenticatedTradeListIsLimitedNotCachedAndBounded() {
        UUID marketId = UUID.randomUUID();
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        when(servletRequest.getRemoteAddr()).thenReturn("203.0.113.10");
        when(tradeService.getTradesForMarket(eq(marketId), any(Pageable.class)))
                .thenReturn(Page.empty());

        var response = controller.getTradesByMarketId(marketId, -2, 500, servletRequest);

        verify(publicRateLimiter).checkMarketList("203.0.113.10");
        assertThat(response.getHeaders().getCacheControl())
            .contains("no-store");
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(tradeService).getTradesForMarket(eq(marketId), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
    }

    private static RateLimitExceededException exceeded() {
        return new RateLimitExceededException("trade", 30L);
    }
}
