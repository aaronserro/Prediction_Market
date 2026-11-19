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

    static String normalizeUsername(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }

    private static String normalizeAddress(String clientIp) {
        return clientIp == null || clientIp.isBlank() ? "unknown" : clientIp.trim();
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
