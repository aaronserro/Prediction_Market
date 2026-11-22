package com.betting.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Component
@ConfigurationProperties(prefix = "app.financial")
@Validated
public class FinancialProperties {

    private boolean signupBonusEnabled;

    @Min(1)
    @Max(1_000_000)
    private long signupBonusCents = 10_000L;

    public boolean isSignupBonusEnabled() {
        return signupBonusEnabled;
    }

    public void setSignupBonusEnabled(boolean signupBonusEnabled) {
        this.signupBonusEnabled = signupBonusEnabled;
    }

    public long getSignupBonusCents() {
        return signupBonusCents;
    }

    public void setSignupBonusCents(long signupBonusCents) {
        this.signupBonusCents = signupBonusCents;
    }
}