package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;

class FinancialRateLimiterTest {

    private RateLimitService service;
    private RateLimitProperties properties;
    private RateLimitKeyFactory keys;
    private FinancialRateLimiter limiter;

    @BeforeEach
    void setUp() {
        service = mock(RateLimitService.class);
        properties = new RateLimitProperties();
        keys = new RateLimitKeyFactory(properties);
        limiter = new FinancialRateLimiter(service, properties, keys);
        when(service.consume(anyString(), any())).thenReturn(RateLimitDecision.allowed(1));
    }

    @Test
    void eachOperationConsumesItsConfiguredUserBucket() {
        limiter.checkTrade(10L);
        limiter.checkWithdraw(11L);
        limiter.checkTransfer(12L);
        limiter.checkFundRequest(13L);
        limiter.checkAdminFinancial(14L);

        verify(service).consume(keys.tradeUser(10L), properties.getTrade().toPolicy());
        verify(service).consume(keys.withdrawUser(11L), properties.getWithdraw().toPolicy());
        verify(service).consume(keys.transferUser(12L), properties.getTransfer().toPolicy());
        verify(service).consume(keys.fundRequestUser(13L), properties.getFundRequest().toPolicy());
        verify(service).consume(keys.adminFinancialUser(14L),
                properties.getAdminFinancial().toPolicy());
    }

    @Test
    void exhaustedBucketReturnsItsRetryAfter() {
        when(service.consume(anyString(), any()))
                .thenReturn(new RateLimitDecision(false, 0, 37));

        assertThatThrownBy(() -> limiter.checkWithdraw(10L))
                .isInstanceOf(RateLimitExceededException.class)
                .extracting("retryAfterSeconds")
                .isEqualTo(37L);
    }

    @Test
    void redisFailureRejectsFinancialOperations() {
        when(service.consume(anyString(), any()))
                .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatThrownBy(() -> limiter.checkTransfer(10L))
                .isInstanceOf(RateLimitUnavailableException.class)
                .hasMessage("Financial operation is temporarily unavailable");
    }

    @Test
    void disabledRateLimitingDoesNotAccessRedis() {
        properties.setEnabled(false);

        limiter.checkTrade(10L);
        limiter.checkWithdraw(10L);
        limiter.checkTransfer(10L);
        limiter.checkFundRequest(10L);
        limiter.checkAdminFinancial(10L);

        verifyNoInteractions(service);
    }

    @Test
    void differentUsersConsumeDifferentKeys() {
        limiter.checkTrade(10L);
        limiter.checkTrade(11L);

        verify(service).consume(keys.tradeUser(10L), properties.getTrade().toPolicy());
        verify(service).consume(keys.tradeUser(11L), properties.getTrade().toPolicy());
        verify(service, never()).consume(keys.withdrawUser(10L), properties.getTrade().toPolicy());
    }
}
