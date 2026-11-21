package com.betting.backend.auth.ratelimit;

public class RateLimitUnavailableException extends RuntimeException {

    public RateLimitUnavailableException(Throwable cause) {
        this("Signup is temporarily unavailable", cause);
    }

    public RateLimitUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
