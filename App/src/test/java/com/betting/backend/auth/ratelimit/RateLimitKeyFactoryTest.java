package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RateLimitKeyFactoryTest {

    @Test
    void accountKeysAreNormalizedAndDoNotExposeTheUsername() {
        RateLimitProperties properties = new RateLimitProperties();
        RateLimitKeyFactory keys = new RateLimitKeyFactory(properties);

        String first = keys.loginAccount("  Alice_User ");
        String second = keys.loginAccount("alice_user");

        assertThat(first).isEqualTo(second);
        assertThat(first).startsWith("ratelimit:v1:login:account:");
        assertThat(first).doesNotContainIgnoringCase("alice");
    }

    @Test
    void ipKeysDoNotExposeTheAddress() {
        RateLimitProperties properties = new RateLimitProperties();
        RateLimitKeyFactory keys = new RateLimitKeyFactory(properties);

        assertThat(keys.loginIp("203.0.113.10"))
                .doesNotContain("203.0.113.10")
                .startsWith("ratelimit:v1:login:ip:");
    }
}
