package com.betting.backend.auth.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

@Component
public class PublicReadRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(PublicReadRateLimiter.class);

    private final RateLimitService rateLimits;
    private final RateLimitProperties properties;
    private final RateLimitKeyFactory keys;

    public PublicReadRateLimiter(RateLimitService rateLimits,
                                 RateLimitProperties properties,
                                 RateLimitKeyFactory keys) {
        this.rateLimits = rateLimits;
        this.properties = properties;
        this.keys = keys;
    }

    public void checkMarketList(String clientIp) {
        check("public-market-list", keys.publicMarketListIp(clientIp),
                properties.getPublicMarketList().toPolicy());
    }

    public void checkQuote(String clientIp) {
        check("public-quote", keys.publicQuoteIp(clientIp),
                properties.getPublicQuote().toPolicy());
    }

    public void checkNews(String clientIp) {
        check("public-news", keys.publicNewsIp(clientIp),
                properties.getPublicNews().toPolicy());
    }

    private void check(String policyName, String key, RateLimitPolicy policy) {
        if (!properties.isEnabled()) {
            return;
        }
        try {
            RateLimitDecision decision = rateLimits.consume(key, policy);
            if (!decision.allowed()) {
                throw new RateLimitExceededException(policyName, decision.retryAfterSeconds());
            }
        } catch (DataAccessException exception) {
            log.warn("Public read rate limiting unavailable policy={}; allowing request", policyName);
        }
    }
}
