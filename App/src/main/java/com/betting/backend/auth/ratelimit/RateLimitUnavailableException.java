package com.betting.backend.auth.ratelimit;

public class RateLimitUnavailableException extends RuntimeException {

    public RateLimitUnavailableException(Throwable cause) {
        super("Signup is temporarily unavailable", cause);
    }
}
