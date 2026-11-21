package com.betting.backend.auth.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

@Component
public class FinancialRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(FinancialRateLimiter.class);

    private final RateLimitService rateLimits;
    private final RateLimitProperties properties;
    private final RateLimitKeyFactory keys;

    public FinancialRateLimiter(RateLimitService rateLimits,
                                RateLimitProperties properties,
                                RateLimitKeyFactory keys) {
        this.rateLimits = rateLimits;
        this.properties = properties;
        this.keys = keys;
    }

    public void checkTrade(Long userId) {
        check("trade", keys.tradeUser(userId), properties.getTrade().toPolicy());
    }

    public void checkWithdraw(Long userId) {
        check("withdraw", keys.withdrawUser(userId), properties.getWithdraw().toPolicy());
    }

    public void checkTransfer(Long userId) {
        check("transfer", keys.transferUser(userId), properties.getTransfer().toPolicy());
    }

    public void checkFundRequest(Long userId) {
        check("fund-request", keys.fundRequestUser(userId), properties.getFundRequest().toPolicy());
    }

    public void checkAdminFinancial(Long adminUserId) {
        check("admin-financial", keys.adminFinancialUser(adminUserId),
                properties.getAdminFinancial().toPolicy());
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
            log.error("Financial rate limiting is unavailable; rejecting the operation", ex);
            throw new RateLimitUnavailableException(
                    "Financial operation is temporarily unavailable", ex);
        }
    }
}
