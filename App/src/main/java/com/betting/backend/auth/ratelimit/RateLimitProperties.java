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
    private Policy trade = new Policy(30, 30, Duration.ofMinutes(1));
    private Policy withdraw = new Policy(3, 3, Duration.ofMinutes(1));
    private Policy transfer = new Policy(10, 10, Duration.ofMinutes(1));
    private Policy fundRequest = new Policy(3, 3, Duration.ofHours(1));
    private Policy adminFinancial = new Policy(20, 20, Duration.ofMinutes(1));
    private Policy adminMarketWrite = new Policy(10, 10, Duration.ofMinutes(1));
    private Policy adminMarketResolve = new Policy(3, 3, Duration.ofMinutes(1));
    private Policy publicMarketList = new Policy(120, 120, Duration.ofMinutes(1));
    private Policy publicQuote = new Policy(60, 60, Duration.ofMinutes(1));
    private Policy publicNews = new Policy(30, 30, Duration.ofMinutes(1));

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

    public Policy getTrade() {
        return trade;
    }

    public void setTrade(Policy trade) {
        this.trade = trade;
    }

    public Policy getWithdraw() {
        return withdraw;
    }

    public void setWithdraw(Policy withdraw) {
        this.withdraw = withdraw;
    }

    public Policy getTransfer() {
        return transfer;
    }

    public void setTransfer(Policy transfer) {
        this.transfer = transfer;
    }

    public Policy getFundRequest() {
        return fundRequest;
    }

    public void setFundRequest(Policy fundRequest) {
        this.fundRequest = fundRequest;
    }

    public Policy getAdminFinancial() {
        return adminFinancial;
    }

    public void setAdminFinancial(Policy adminFinancial) {
        this.adminFinancial = adminFinancial;
    }

    public Policy getAdminMarketWrite() {
        return adminMarketWrite;
    }

    public void setAdminMarketWrite(Policy adminMarketWrite) {
        this.adminMarketWrite = adminMarketWrite;
    }

    public Policy getAdminMarketResolve() {
        return adminMarketResolve;
    }

    public void setAdminMarketResolve(Policy adminMarketResolve) {
        this.adminMarketResolve = adminMarketResolve;
    }

    public Policy getPublicMarketList() {
        return publicMarketList;
    }

    public void setPublicMarketList(Policy publicMarketList) {
        this.publicMarketList = publicMarketList;
    }

    public Policy getPublicQuote() {
        return publicQuote;
    }

    public void setPublicQuote(Policy publicQuote) {
        this.publicQuote = publicQuote;
    }

    public Policy getPublicNews() {
        return publicNews;
    }

    public void setPublicNews(Policy publicNews) {
        this.publicNews = publicNews;
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
