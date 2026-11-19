package com.betting.backend.auth.ratelimit;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;
    private String namespace = "ratelimit:v1";
    private Policy loginIp = new Policy(10, 10, Duration.ofMinutes(1));
    private Policy loginAccount = new Policy(5, 5, Duration.ofMinutes(15));
    private Policy signupHour = new Policy(3, 3, Duration.ofHours(1));
    private Policy signupDay = new Policy(10, 10, Duration.ofDays(1));

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public Policy getLoginIp() {
        return loginIp;
    }

    public void setLoginIp(Policy loginIp) {
        this.loginIp = loginIp;
    }

    public Policy getLoginAccount() {
        return loginAccount;
    }

    public void setLoginAccount(Policy loginAccount) {
        this.loginAccount = loginAccount;
    }

    public Policy getSignupHour() {
        return signupHour;
    }

    public void setSignupHour(Policy signupHour) {
        this.signupHour = signupHour;
    }

    public Policy getSignupDay() {
        return signupDay;
    }

    public void setSignupDay(Policy signupDay) {
        this.signupDay = signupDay;
    }

    public static class Policy {
        private long capacity;
        private long refillTokens;
        private Duration refillPeriod;

        public Policy() {
        }

        public Policy(long capacity, long refillTokens, Duration refillPeriod) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillPeriod = refillPeriod;
        }

        public long getCapacity() {
            return capacity;
        }

        public void setCapacity(long capacity) {
            this.capacity = capacity;
        }

        public long getRefillTokens() {
            return refillTokens;
        }

        public void setRefillTokens(long refillTokens) {
            this.refillTokens = refillTokens;
        }

        public Duration getRefillPeriod() {
            return refillPeriod;
        }

        public void setRefillPeriod(Duration refillPeriod) {
            this.refillPeriod = refillPeriod;
        }

        public RateLimitPolicy toPolicy() {
            return new RateLimitPolicy(capacity, refillTokens, refillPeriod);
        }
    }
}
