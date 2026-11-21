package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

@Testcontainers(disabledWithoutDocker = true)
@EnabledIfEnvironmentVariable(named = "RUN_REDIS_INTEGRATION_TESTS", matches = "true")
class RedisRateLimitServiceIT {

    @Container
    @SuppressWarnings("resource")
    private static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7.4-alpine"))
            .withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private RedisRateLimitService service;

    @BeforeEach
    void setUp() {
        connectionFactory = new LettuceConnectionFactory(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate(connectionFactory);
        template.afterPropertiesSet();
        service = new RedisRateLimitService(template);
    }

    @AfterEach
    void tearDown() {
        connectionFactory.destroy();
    }

    @Test
    void concurrentConsumersCannotExceedCapacity() throws Exception {
        int capacity = 10;
        String key = "test:" + UUID.randomUUID();
        RateLimitPolicy policy = new RateLimitPolicy(capacity, 1, Duration.ofHours(1));
        ExecutorService executor = Executors.newFixedThreadPool(20);

        try {
            List<Callable<RateLimitDecision>> calls = new ArrayList<>();
            for (int i = 0; i < 50; i++) {
                calls.add(() -> service.consume(key, policy));
            }

            List<Future<RateLimitDecision>> futures = executor.invokeAll(calls);
            long allowed = 0;
            for (Future<RateLimitDecision> future : futures) {
                if (future.get().allowed()) {
                    allowed++;
                }
            }

            assertThat(allowed).isEqualTo(capacity);
            RateLimitDecision denied = service.consume(key, policy);
            assertThat(denied.allowed()).isFalse();
            assertThat(denied.retryAfterSeconds()).isPositive();
        } finally {
            executor.shutdownNow();
        }
    }
}
