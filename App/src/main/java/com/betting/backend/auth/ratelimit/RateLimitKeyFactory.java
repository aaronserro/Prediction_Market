package com.betting.backend.auth.ratelimit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.stereotype.Component;

@Component
public class RateLimitKeyFactory {

    private final String namespace;

    public RateLimitKeyFactory(RateLimitProperties properties) {
        String configured = properties.getNamespace();
        this.namespace = configured == null || configured.isBlank()
                ? "ratelimit:v1"
                : configured.trim();
    }

    public String loginIp(String clientIp) {
        return key("login:ip", normalizeAddress(clientIp));
    }

    public String loginAccount(String username) {
        return key("login:account", normalizeUsername(username));
    }

    public String signupHour(String clientIp) {
        return key("signup:hour:ip", normalizeAddress(clientIp));
    }

    public String signupDay(String clientIp) {
        return key("signup:day:ip", normalizeAddress(clientIp));
    }

    public String tradeUser(Long userId) {
        return key("trade:user", requireUserId(userId));
    }

    public String withdrawUser(Long userId) {
        return key("withdraw:user", requireUserId(userId));
    }

    public String transferUser(Long userId) {
        return key("transfer:user", requireUserId(userId));
    }

    public String fundRequestUser(Long userId) {
        return key("fund-request:user", requireUserId(userId));
    }

    public String adminFinancialUser(Long userId) {
        return key("admin-financial:user", requireUserId(userId));
    }

    public String adminMarketWriteUser(Long userId) {
        return key("admin-market-write:user", requireUserId(userId));
    }

    public String adminMarketResolveUser(Long userId) {
        return key("admin-market-resolve:user", requireUserId(userId));
    }

    public String publicMarketListIp(String clientIp) {
        return key("public-market-list:ip", normalizeAddress(clientIp));
    }

    public String publicQuoteIp(String clientIp) {
        return key("public-quote:ip", normalizeAddress(clientIp));
    }

    public String publicNewsIp(String clientIp) {
        return key("public-news:ip", normalizeAddress(clientIp));
    }

    static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeAddress(String clientIp) {
        return clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
    }

    private static String requireUserId(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Authenticated user ID is required");
        }
        return userId.toString();
    }

    private String key(String policy, String subject) {
        return namespace + ":" + policy + ":" + sha256(subject);
    }

    private static String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
