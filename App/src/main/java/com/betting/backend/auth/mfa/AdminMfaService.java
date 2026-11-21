package com.betting.backend.auth.mfa;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.user.User;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;

@Service
public class AdminMfaService {

    private static final int GCM_IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;

    private final AdminMfaCredentialRepository credentials;
    private final DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final DefaultCodeVerifier codeVerifier = new DefaultCodeVerifier(
            new DefaultCodeGenerator(), new SystemTimeProvider());
    private final SecureRandom secureRandom = new SecureRandom();
    private final byte[] encryptionKey;

    public AdminMfaService(
            AdminMfaCredentialRepository credentials,
            @Value("${app.mfa.encryption-key:${app.jwt.secret:}}") String encryptionKey) {
        this.credentials = credentials;
        this.encryptionKey = encryptionKey.getBytes(StandardCharsets.UTF_8);
        codeVerifier.setAllowedTimePeriodDiscrepancy(1);
    }

    @Transactional
    public Enrollment beginEnrollment(User admin) {
        requireAdministrator(admin);
        String secret = secretGenerator.generate();
        credentials.save(new AdminMfaCredential(admin.getId(), encrypt(secret)));
        return new Enrollment(secret);
    }

    @Transactional
    public void confirmEnrollment(User admin, String code) {
        requireAdministrator(admin);
        AdminMfaCredential credential = credentials.findById(admin.getId())
                .orElseThrow(() -> new IllegalStateException("MFA enrollment has not started"));
        if (!validCode(decrypt(credential.getEncryptedSecret()), code)) {
            throw new BadCredentialsException("Invalid MFA code");
        }
        credential.confirm();
        credentials.save(credential);
    }

    @Transactional(readOnly = true)
    public boolean verify(User admin, String code) {
        requireAdministrator(admin);
        return credentials.findById(admin.getId())
                .filter(AdminMfaCredential::isEnabled)
                .map(credential -> validCode(decrypt(credential.getEncryptedSecret()), code))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public void requireEnabled(User admin) {
        requireAdministrator(admin);
        if (credentials.findById(admin.getId()).filter(AdminMfaCredential::isEnabled).isEmpty()) {
            throw new BadCredentialsException("Administrator MFA enrollment is required");
        }
    }

    private boolean validCode(String secret, String code) {
        return code != null && code.matches("^[0-9]{6}$") && codeVerifier.isValidCode(secret, code);
    }

    private void requireAdministrator(User user) {
        boolean administrator = user != null && user.getId() != null
                && user.getAuthorities().stream()
                    .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!administrator) {
            throw new IllegalArgumentException("Administrator account is required");
        }
    }

    private String encrypt(String plaintext) {
        requireEncryptionKey();
        byte[] iv = new byte[GCM_IV_BYTES];
        secureRandom.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, aesKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to encrypt MFA credential", exception);
        }
    }

    private String decrypt(String payload) {
        requireEncryptionKey();
        byte[] decoded = Base64.getDecoder().decode(payload);
        if (decoded.length <= GCM_IV_BYTES) {
            throw new IllegalStateException("Invalid encrypted MFA credential");
        }
        byte[] iv = new byte[GCM_IV_BYTES];
        byte[] encrypted = new byte[decoded.length - GCM_IV_BYTES];
        System.arraycopy(decoded, 0, iv, 0, iv.length);
        System.arraycopy(decoded, iv.length, encrypted, 0, encrypted.length);
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, aesKey(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to decrypt MFA credential", exception);
        }
    }

    private SecretKeySpec aesKey() {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(encryptionKey);
            return new SecretKeySpec(digest, "AES");
        } catch (GeneralSecurityException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable", impossible);
        }
    }

    private void requireEncryptionKey() {
        if (encryptionKey.length < 32) {
            throw new IllegalStateException("MFA encryption key must be at least 32 bytes long");
        }
    }

    public record Enrollment(String secret) {}
}
