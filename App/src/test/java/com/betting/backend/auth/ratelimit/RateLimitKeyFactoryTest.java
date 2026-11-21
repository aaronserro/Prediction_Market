package com.betting.backend.auth.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    @Test
    void publicReadKeysAreHashedAndIsolatedByPolicy() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());
        String address = "203.0.113.10";

        assertThat(keys.publicMarketListIp(address))
                .startsWith("ratelimit:v1:public-market-list:ip:")
                .doesNotContain(address);
        assertThat(keys.publicQuoteIp(address))
                .startsWith("ratelimit:v1:public-quote:ip:")
                .doesNotContain(address)
                .isNotEqualTo(keys.publicMarketListIp(address));
        assertThat(keys.publicNewsIp(address))
                .startsWith("ratelimit:v1:public-news:ip:")
                .doesNotContain(address)
                .isNotEqualTo(keys.publicQuoteIp(address));
    }

    @Test
    void financialKeysUsePolicyPrefixesWithoutExposingUserIds() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThat(keys.tradeUser(42L))
                .startsWith("ratelimit:v1:trade:user:")
                .doesNotContain(":42");
        assertThat(keys.withdrawUser(42L))
                .startsWith("ratelimit:v1:withdraw:user:")
                .doesNotContain(":42");
        assertThat(keys.transferUser(42L))
                .startsWith("ratelimit:v1:transfer:user:")
                .doesNotContain(":42");
        assertThat(keys.fundRequestUser(42L))
                .startsWith("ratelimit:v1:fund-request:user:")
                .doesNotContain(":42");
        assertThat(keys.adminFinancialUser(42L))
                .startsWith("ratelimit:v1:admin-financial:user:")
                .doesNotContain(":42");
    }

    @Test
    void financialKeysAreStableAndIsolatedByUserAndPolicy() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThat(keys.tradeUser(42L)).isEqualTo(keys.tradeUser(42L));
        assertThat(keys.tradeUser(42L)).isNotEqualTo(keys.tradeUser(43L));
        assertThat(keys.tradeUser(42L)).isNotEqualTo(keys.withdrawUser(42L));
    }

    @Test
    void financialKeysRejectMissingUserIds() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThatThrownBy(() -> keys.tradeUser(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Authenticated user ID is required");
    }

    @Test
    void adminMarketKeysUseExpectedPrefixesWithoutExposingUserIds() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThat(keys.adminMarketWriteUser(42L))
                .startsWith("ratelimit:v1:admin-market-write:user:")
                .doesNotContain(":42");
        assertThat(keys.adminMarketResolveUser(42L))
                .startsWith("ratelimit:v1:admin-market-resolve:user:")
                .doesNotContain(":42");
    }

    @Test
    void adminMarketKeysAreStableAndIsolatedByUserAndPolicy() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThat(keys.adminMarketWriteUser(42L))
                .isEqualTo(keys.adminMarketWriteUser(42L));
        assertThat(keys.adminMarketWriteUser(42L))
                .isNotEqualTo(keys.adminMarketWriteUser(43L));
        assertThat(keys.adminMarketWriteUser(42L))
                .isNotEqualTo(keys.adminMarketResolveUser(42L));
    }

    @Test
    void adminMarketKeysRejectMissingAdministratorIds() {
        RateLimitKeyFactory keys = new RateLimitKeyFactory(new RateLimitProperties());

        assertThatThrownBy(() -> keys.adminMarketWriteUser(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Authenticated user ID is required");
        assertThatThrownBy(() -> keys.adminMarketResolveUser(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Authenticated user ID is required");
    }
}
