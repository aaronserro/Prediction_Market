package com.betting.backend.auth.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

@Component
public class AdminMarketRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(AdminMarketRateLimiter.class);

    private final RateLimitService rateLimits;
    private final RateLimitProperties properties;
    private final RateLimitKeyFactory keys;

    public AdminMarketRateLimiter(RateLimitService rateLimits,
                                  RateLimitProperties properties,
                                  RateLimitKeyFactory keys) {
        this.rateLimits = rateLimits;
        this.properties = properties;
        this.keys = keys;
    }

    public void checkMarketWrite(Long adminUserId) {
        check("admin-market-write", keys.adminMarketWriteUser(adminUserId),
                properties.getAdminMarketWrite().toPolicy());
    }

    public void checkMarketResolve(Long adminUserId) {
        check("admin-market-resolve", keys.adminMarketResolveUser(adminUserId),
                properties.getAdminMarketResolve().toPolicy());
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
        } catch (DataAccessException ex) {
            log.error("Administrator market rate limiting is unavailable; rejecting the operation", ex);
            throw new RateLimitUnavailableException(
                    "Administrator market operation is temporarily unavailable", ex);
        }
    }
}
