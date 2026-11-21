package com.betting.backend.markets;

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

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.betting.backend.auth.ratelimit.AdminMarketRateLimiter;
import com.betting.backend.auth.ratelimit.PublicReadRateLimiter;
import com.betting.backend.auth.ratelimit.RateLimitExceededException;
import com.betting.backend.audit.AuditService;
import com.betting.backend.markets.dto.MarketCreateRequest;
import com.betting.backend.markets.dto.MarketResponse;
import com.betting.backend.markets.dto.UpdateMarketRequest;
import com.betting.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;

class MarketControllerRateLimitTest {

    private MarketService marketService;
    private AdminMarketRateLimiter rateLimiter;
    private AuditService auditService;
    private PublicReadRateLimiter publicRateLimiter;
    private MarketController controller;
    private User admin;

    @BeforeEach
    void setUp() {
        marketService = mock(MarketService.class);
        rateLimiter = mock(AdminMarketRateLimiter.class);
        auditService = mock(AuditService.class);
        publicRateLimiter = mock(PublicReadRateLimiter.class);
        controller = new MarketController(
            marketService, mock(PricingService.class), rateLimiter, auditService,
            publicRateLimiter);
        admin = new User();
        admin.setId(99L);
    }

    @Test
    void blockedCreationDoesNotCreateMarket() {
        MarketCreateRequest request = new MarketCreateRequest();
        doThrow(exceeded("admin-market-write"))
                .when(rateLimiter).checkMarketWrite(99L);

        assertThatThrownBy(() -> controller.createMarket(request, admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkMarketWrite(99L);
        verifyNoInteractions(marketService);
    }

    @Test
    void blockedUpdateDoesNotUpdateMarket() {
        UUID marketId = UUID.randomUUID();
        UpdateMarketRequest request = new UpdateMarketRequest();
        doThrow(exceeded("admin-market-write"))
                .when(rateLimiter).checkMarketWrite(99L);

        assertThatThrownBy(() -> controller.updateMarket(marketId, request, admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkMarketWrite(99L);
        verifyNoInteractions(marketService);
    }

    @Test
    void blockedResolutionDoesNotResolveMarket() {
        UUID marketId = UUID.randomUUID();
        UUID outcomeId = UUID.randomUUID();
        doThrow(exceeded("admin-market-resolve"))
                .when(rateLimiter).checkMarketResolve(99L);

        assertThatThrownBy(() -> controller.resolveMarket(marketId, outcomeId, admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkMarketResolve(99L);
        verifyNoInteractions(marketService);
    }

    @Test
    void allowedCreationChecksLimitBeforeMutation() {
        MarketCreateRequest request = new MarketCreateRequest();
        when(marketService.createMarket(request)).thenReturn(new MarketResponse());

        controller.createMarket(request, admin);

        InOrder order = inOrder(rateLimiter, marketService);
        order.verify(rateLimiter).checkMarketWrite(99L);
        order.verify(marketService).createMarket(request);
        verify(auditService).success(99L, "MARKET_CREATE", "MARKET", null);
    }

    @Test
    void allowedUpdateChecksLimitBeforeMutation() {
        UUID marketId = UUID.randomUUID();
        UpdateMarketRequest request = new UpdateMarketRequest();
        when(marketService.updateMarket(marketId, request)).thenReturn(new MarketResponse());

        controller.updateMarket(marketId, request, admin);

        InOrder order = inOrder(rateLimiter, marketService);
        order.verify(rateLimiter).checkMarketWrite(99L);
        order.verify(marketService).updateMarket(marketId, request);
        verify(auditService).success(99L, "MARKET_UPDATE", "MARKET", marketId.toString());
    }

    @Test
    void allowedResolutionChecksLimitBeforeSettlement() {
        UUID marketId = UUID.randomUUID();
        UUID outcomeId = UUID.randomUUID();
        when(marketService.resolveMarket(marketId, outcomeId)).thenReturn(0);

        controller.resolveMarket(marketId, outcomeId, admin);

        InOrder order = inOrder(rateLimiter, marketService);
        order.verify(rateLimiter).checkMarketResolve(99L);
        order.verify(marketService).resolveMarket(marketId, outcomeId);
        verify(auditService).success(99L, "MARKET_RESOLVE", "MARKET", marketId.toString());
    }

    @Test
    void publicMarketListIsLimitedCachedAndBounded() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        when(marketService.getMarkets(eq(null), eq(null), any(Pageable.class)))
                .thenReturn(Page.empty());

        var response = controller.getAllMarkets(-2, 500, null, null, request);

        verify(publicRateLimiter).checkMarketList("203.0.113.10");
        assertThat(response.getHeaders().getCacheControl())
                .contains("public").contains("max-age=30");
        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(marketService).getMarkets(eq(null), eq(null), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
    }

    private static RateLimitExceededException exceeded(String policy) {
        return new RateLimitExceededException(policy, 30L);
    }
}
