package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.data.redis.RedisConnectionFailureException;

class AuthRateLimiterTest {

    private RateLimitService service;
    private RateLimitProperties properties;
    private RateLimitKeyFactory keys;
    private AuthRateLimiter limiter;

    @BeforeEach
    void setUp() {
        service = mock(RateLimitService.class);
        properties = new RateLimitProperties();
        keys = new RateLimitKeyFactory(properties);
        limiter = new AuthRateLimiter(service, properties, keys);
        when(service.consume(anyString(), any())).thenReturn(RateLimitDecision.allowed(9));
        when(service.inspect(anyString(), any())).thenReturn(RateLimitDecision.allowed(4));
    }

    @Test
    void loginChecksIpThenAccount() {
        limiter.checkLogin("203.0.113.10", "Alice");

        InOrder order = inOrder(service);
        order.verify(service).consume(keys.loginIp("203.0.113.10"), properties.getLoginIp().toPolicy());
        order.verify(service).inspect(keys.loginAccount("Alice"), properties.getLoginAccount().toPolicy());
    }

    @Test
    void exhaustedLoginIpRejectsBeforeAccountCheck() {
        when(service.consume(anyString(), any()))
                .thenReturn(new RateLimitDecision(false, 0, 42));

        assertThatThrownBy(() -> limiter.checkLogin("203.0.113.10", "Alice"))
                .isInstanceOf(RateLimitExceededException.class)
                .extracting("retryAfterSeconds")
                .isEqualTo(42L);
        verify(service, never()).inspect(anyString(), any());
    }

    @Test
        void loginFailsClosedWhenRedisIsUnavailable() {
        when(service.consume(anyString(), any()))
                .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatThrownBy(() -> limiter.checkLogin("203.0.113.10", "Alice"))
            .isInstanceOf(RateLimitUnavailableException.class)
            .hasMessage("Login is temporarily unavailable");
        }

        @Test
        void failedLoginRecordingFailsClosedWhenRedisIsUnavailable() {
        when(service.consume(anyString(), any()))
            .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatThrownBy(() -> limiter.recordLoginFailure("Alice"))
            .isInstanceOf(RateLimitUnavailableException.class)
            .hasMessage("Login is temporarily unavailable");
        }

        @Test
        void successfulLoginCleanupFailsClosedWhenRedisIsUnavailable() {
        org.mockito.Mockito.doThrow(new RedisConnectionFailureException("offline"))
            .when(service).clear(anyString());

        assertThatThrownBy(() -> limiter.clearLoginFailures("Alice"))
            .isInstanceOf(RateLimitUnavailableException.class)
            .hasMessage("Login is temporarily unavailable");
    }

    @Test
    void signupFailsClosedWhenRedisIsUnavailable() {
        when(service.consume(anyString(), any()))
                .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatThrownBy(() -> limiter.checkSignup("203.0.113.10"))
                .isInstanceOf(RateLimitUnavailableException.class);
    }

    @Test
    void successfulLoginCanClearOnlyItsAccountFailureBucket() {
        limiter.clearLoginFailures("Alice");

        verify(service).clear(keys.loginAccount("Alice"));
        verify(service, never()).clear(keys.loginIp("203.0.113.10"));
    }
}
