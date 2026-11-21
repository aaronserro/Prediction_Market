package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThatCode;
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

class PublicReadRateLimiterTest {

    private RateLimitService service;
    private RateLimitProperties properties;
    private RateLimitKeyFactory keys;
    private PublicReadRateLimiter limiter;

    @BeforeEach
    void setUp() {
        service = mock(RateLimitService.class);
        properties = new RateLimitProperties();
        keys = new RateLimitKeyFactory(properties);
        limiter = new PublicReadRateLimiter(service, properties, keys);
        when(service.consume(anyString(), any())).thenReturn(RateLimitDecision.allowed(1));
    }

    @Test
    void eachEndpointConsumesItsConfiguredIpBucket() {
        limiter.checkMarketList("203.0.113.10");
        limiter.checkQuote("203.0.113.11");
        limiter.checkNews("203.0.113.12");

        verify(service).consume(keys.publicMarketListIp("203.0.113.10"),
                properties.getPublicMarketList().toPolicy());
        verify(service).consume(keys.publicQuoteIp("203.0.113.11"),
                properties.getPublicQuote().toPolicy());
        verify(service).consume(keys.publicNewsIp("203.0.113.12"),
                properties.getPublicNews().toPolicy());
    }

    @Test
    void exhaustedBucketReturnsRetryAfter() {
        when(service.consume(anyString(), any()))
                .thenReturn(new RateLimitDecision(false, 0, 19));

        assertThatThrownBy(() -> limiter.checkQuote("203.0.113.10"))
                .isInstanceOf(RateLimitExceededException.class)
                .extracting("retryAfterSeconds")
                .isEqualTo(19L);
    }

    @Test
    void redisFailureFailsOpenForPublicReads() {
        when(service.consume(anyString(), any()))
                .thenThrow(new RedisConnectionFailureException("offline"));

        assertThatCode(() -> limiter.checkMarketList("203.0.113.10"))
                .doesNotThrowAnyException();
        assertThatCode(() -> limiter.checkQuote("203.0.113.10"))
                .doesNotThrowAnyException();
        assertThatCode(() -> limiter.checkNews("203.0.113.10"))
                .doesNotThrowAnyException();
    }

    @Test
    void disabledRateLimitingDoesNotAccessRedis() {
        properties.setEnabled(false);

        limiter.checkMarketList("203.0.113.10");
        limiter.checkQuote("203.0.113.10");
        limiter.checkNews("203.0.113.10");

        verifyNoInteractions(service);
    }
}
