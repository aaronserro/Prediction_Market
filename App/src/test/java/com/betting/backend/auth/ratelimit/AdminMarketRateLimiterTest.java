package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;

class AdminMarketRateLimiterTest {

    private RateLimitService service;
    private RateLimitProperties properties;
    private RateLimitKeyFactory keys;
    private AdminMarketRateLimiter limiter;

    @BeforeEach
    void setUp() {
        service = mock(RateLimitService.class);
        properties = new RateLimitProperties();
        keys = new RateLimitKeyFactory(properties);
        limiter = new AdminMarketRateLimiter(service, properties, keys);
        when(service.consume(anyString(), any())).thenReturn(RateLimitDecision.allowed(1));
    }

    @Test
    void marketWriteConsumesItsConfiguredAdministratorBucket() {
        limiter.checkMarketWrite(10L);

        verify(service).consume(
                keys.adminMarketWriteUser(10L), properties.getAdminMarketWrite().toPolicy());
    }

    @Test
    void marketResolveConsumesItsConfiguredAdministratorBucket() {
        limiter.checkMarketResolve(10L);

        verify(service).consume(
                keys.adminMarketResolveUser(10L), properties.getAdminMarketResolve().toPolicy());
    }

    @Test
    void exhaustedBucketPreservesPolicyAndRetryAfter() {
        when(service.consume(anyString(), any()))
                .thenReturn(new RateLimitDecision(false, 0, 37));

        assertThatThrownBy(() -> limiter.checkMarketResolve(10L))
                .isInstanceOf(RateLimitExceededException.class)
                .hasFieldOrPropertyWithValue("policy", "admin-market-resolve")
                .hasFieldOrPropertyWithValue("retryAfterSeconds", 37L);
    }

    @Test
    void disabledRateLimitingDoesNotAccessRedis() {
        properties.setEnabled(false);

        limiter.checkMarketWrite(10L);
        limiter.checkMarketResolve(10L);

        verifyNoInteractions(service);
    }

    @Test
    void redisFailureRejectsAdministratorMarketOperations() {
        when(service.consume(anyString(), any()))
                .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatThrownBy(() -> limiter.checkMarketWrite(10L))
                .isInstanceOf(RateLimitUnavailableException.class)
                .hasMessage("Administrator market operation is temporarily unavailable");
    }

    @Test
    void differentAdministratorsConsumeIsolatedKeys() {
        limiter.checkMarketWrite(10L);
        limiter.checkMarketWrite(11L);

        verify(service).consume(
                keys.adminMarketWriteUser(10L), properties.getAdminMarketWrite().toPolicy());
        verify(service).consume(
                keys.adminMarketWriteUser(11L), properties.getAdminMarketWrite().toPolicy());
    }
}
