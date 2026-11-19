package com.betting.backend.auth.ratelimit;

import java.util.List;

import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

@Service
public class RedisRateLimitService implements RateLimitService {

    private static final String TOKEN_BUCKET_LUA = """
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refillTokens = tonumber(ARGV[2])
            local refillPeriodMs = tonumber(ARGV[3])
            local ttlMs = tonumber(ARGV[4])
            local consume = tonumber(ARGV[5])

            local redisTime = redis.call('TIME')
            local nowMs = (tonumber(redisTime[1]) * 1000) + math.floor(tonumber(redisTime[2]) / 1000)
            local state = redis.call('HMGET', key, 'tokens', 'updatedAt')
            local tokens = tonumber(state[1])
            local updatedAt = tonumber(state[2])

            if tokens == nil or updatedAt == nil then
                tokens = capacity
                updatedAt = nowMs
            else
                local elapsedMs = math.max(0, nowMs - updatedAt)
                tokens = math.min(capacity, tokens + (elapsedMs * refillTokens / refillPeriodMs))
                updatedAt = nowMs
            end

            local allowed = 0
            local retryAfterMs = 0
            if tokens >= 1 then
                allowed = 1
                if consume == 1 then
                    tokens = tokens - 1
                end
            else
                retryAfterMs = math.ceil((1 - tokens) * refillPeriodMs / refillTokens)
            end

            redis.call('HSET', key, 'tokens', tokens, 'updatedAt', updatedAt)
            redis.call('PEXPIRE', key, ttlMs)
            return {allowed, math.floor(tokens), retryAfterMs}
            """;

    private static final DefaultRedisScript<List<Long>> TOKEN_BUCKET_SCRIPT = createScript();

    private final StringRedisTemplate redis;

    public RedisRateLimitService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public RateLimitDecision consume(String key, RateLimitPolicy policy) {
        return evaluate(key, policy, true);
    }

    @Override
    public RateLimitDecision inspect(String key, RateLimitPolicy policy) {
        return evaluate(key, policy, false);
    }

    @Override
    public void clear(String key) {
        redis.delete(key);
    }

    private RateLimitDecision evaluate(String key, RateLimitPolicy policy, boolean consume) {
        List<Long> result = redis.execute(
                TOKEN_BUCKET_SCRIPT,
                List.of(key),
                Long.toString(policy.capacity()),
                Long.toString(policy.refillTokens()),
                Long.toString(policy.refillPeriod().toMillis()),
                Long.toString(policy.keyTtl().toMillis()),
                consume ? "1" : "0");

        if (result == null || result.size() != 3) {
            throw new RedisSystemException("Redis returned an invalid rate-limit result",
                    new IllegalStateException("Expected three token-bucket values"));
        }

        boolean allowed = asLong(result.get(0)) == 1L;
        long remaining = Math.max(0L, asLong(result.get(1)));
        long retryAfterMillis = Math.max(0L, asLong(result.get(2)));
        long retryAfterSeconds = allowed ? 0L : Math.max(1L, (retryAfterMillis + 999L) / 1000L);
        return new RateLimitDecision(allowed, remaining, retryAfterSeconds);
    }

    private static long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(value.toString());
    }

    @SuppressWarnings("unchecked")
    private static DefaultRedisScript<List<Long>> createScript() {
        DefaultRedisScript<List<Long>> script = new DefaultRedisScript<>();
        script.setScriptText(TOKEN_BUCKET_LUA);
        script.setResultType((Class<List<Long>>) (Class<?>) List.class);
        return script;
    }
}
