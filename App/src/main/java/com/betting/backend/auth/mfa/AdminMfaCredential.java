package com.betting.backend.auth.mfa;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "admin_mfa_credentials")
public class AdminMfaCredential {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "encrypted_secret", nullable = false, length = 1024)
    private String encryptedSecret;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    protected AdminMfaCredential() {}

    public AdminMfaCredential(Long userId, String encryptedSecret) {
        this.userId = userId;
        this.encryptedSecret = encryptedSecret;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEncryptedSecret() {
        return encryptedSecret;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public void confirm() {
        enabled = true;
        verifiedAt = Instant.now();
    }
}
