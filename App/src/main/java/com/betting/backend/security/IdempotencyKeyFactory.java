package com.betting.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

@Component
public class IdempotencyKeyFactory {

    private static final int MAX_CLIENT_KEY_LENGTH = 128;

    public String requireAndScope(String operation, Long actorId, String clientKey) {
        if (operation == null || operation.isBlank()) {
            throw new IllegalArgumentException("Idempotency operation is required");
        }
        if (actorId == null) {
            throw new IllegalArgumentException("Authenticated user ID is required");
        }
        if (clientKey == null || clientKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key is required");
        }

        String normalizedKey = clientKey.trim();
        if (normalizedKey.length() > MAX_CLIENT_KEY_LENGTH) {
            throw new IllegalArgumentException(
                    "Idempotency-Key must not exceed " + MAX_CLIENT_KEY_LENGTH + " characters");
        }

        return "idem:v1:" + operation + ":" + sha256(actorId + ":" + normalizedKey);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }
}
