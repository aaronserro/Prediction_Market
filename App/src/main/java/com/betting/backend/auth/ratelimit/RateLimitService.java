package com.betting.backend.auth.ratelimit;

public interface RateLimitService {

    RateLimitDecision consume(String key, RateLimitPolicy policy);

    RateLimitDecision inspect(String key, RateLimitPolicy policy);

    void clear(String key);
}
