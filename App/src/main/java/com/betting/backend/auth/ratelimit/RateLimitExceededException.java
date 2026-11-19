package com.betting.backend.auth.ratelimit;

public class RateLimitExceededException extends RuntimeException {

    private final long retryAfterSeconds;
    private final String policy;

    public RateLimitExceededException(String policy, long retryAfterSeconds) {
        super("Too many requests; try again later");
        this.policy = policy;
        this.retryAfterSeconds = Math.max(1L, retryAfterSeconds);
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }

    public String getPolicy() {
        return policy;
    }
}
