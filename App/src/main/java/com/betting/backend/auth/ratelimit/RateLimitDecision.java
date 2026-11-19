package com.betting.backend.auth.ratelimit;

public record RateLimitDecision(boolean allowed, long remainingTokens, long retryAfterSeconds) {

    public static RateLimitDecision allowed(long remainingTokens) {
        return new RateLimitDecision(true, remainingTokens, 0L);
    }
}
