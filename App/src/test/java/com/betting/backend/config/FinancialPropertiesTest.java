package com.betting.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class FinancialPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class,
                    ValidationAutoConfiguration.class))
            .withUserConfiguration(FinancialProperties.class);

    @Test
    void defaultsAreDisabledAndUseExpectedAmount() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            FinancialProperties properties = context.getBean(FinancialProperties.class);
            assertThat(properties.isSignupBonusEnabled()).isFalse();
            assertThat(properties.getSignupBonusCents()).isEqualTo(10_000L);
        });
    }

    @Test
    void explicitValuesAreBound() {
        contextRunner
                .withPropertyValues(
                        "app.financial.signup-bonus-enabled=true",
                        "app.financial.signup-bonus-cents=25000")
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    FinancialProperties properties = context.getBean(FinancialProperties.class);
                    assertThat(properties.isSignupBonusEnabled()).isTrue();
                    assertThat(properties.getSignupBonusCents()).isEqualTo(25_000L);
                });
    }

    @Test
    void zeroAmountPreventsStartup() {
        assertInvalidAmount(0L);
    }

    @Test
    void negativeAmountPreventsStartup() {
        assertInvalidAmount(-1L);
    }

    @Test
    void excessiveAmountPreventsStartup() {
        assertInvalidAmount(1_000_001L);
    }

    private void assertInvalidAmount(long amount) {
        contextRunner
                .withPropertyValues("app.financial.signup-bonus-cents=" + amount)
                .run(context -> assertThat(context).hasFailed());
    }
}