package com.betting.backend.auth.mfa;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminMfaCredentialRepository extends JpaRepository<AdminMfaCredential, Long> {
}
