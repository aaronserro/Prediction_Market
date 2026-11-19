package com.betting.backend.auth.ratelimit;

import java.time.Duration;

public record RateLimitPolicy(long capacity, long refillTokens, Duration refillPeriod) {

    public RateLimitPolicy {
        if (capacity <= 0) {
            throw new IllegalArgumentException("Rate-limit capacity must be positive");
        }
        if (refillTokens <= 0) {
            throw new IllegalArgumentException("Rate-limit refill tokens must be positive");
        }
        if (refillPeriod == null || refillPeriod.isZero() || refillPeriod.isNegative()) {
            throw new IllegalArgumentException("Rate-limit refill period must be positive");
        }
    }

    public Duration keyTtl() {
        long refillPeriods = Math.max(1L, (capacity + refillTokens - 1L) / refillTokens);
        return refillPeriod.multipliedBy(refillPeriods + 1L);
    }
}
