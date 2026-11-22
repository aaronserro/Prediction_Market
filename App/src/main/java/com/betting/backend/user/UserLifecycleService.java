package com.betting.backend.user;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.audit.AuditService;
import com.betting.backend.auth.mfa.AdminMfaCredentialRepository;

@Service
public class UserLifecycleService {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";

    private final UserRepository users;
    private final AdminMfaCredentialRepository mfaCredentials;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserLifecycleService(UserRepository users,
                                AdminMfaCredentialRepository mfaCredentials,
                                PasswordEncoder passwordEncoder,
                                AuditService auditService) {
        this.users = users;
        this.mfaCredentials = mfaCredentials;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional
    public void deactivateAndAnonymize(Long targetUserId, User administrator) {
        if (targetUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }
        if (administrator == null || administrator.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Authenticated administrator is required");
        }
        if (administrator.getId().equals(targetUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Administrators cannot deactivate themselves");
        }

        // Always acquire these locks in the same order so two administrator
        // deactivations cannot both remove the final enabled administrators.
        List<User> enabledAdministrators = users.findEnabledAdministratorsForUpdate();
        User target = users.findByIdForUpdate(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (!target.isEnabled() && target.getDeactivatedAt() != null) {
            return;
        }
        if (!target.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Disabled account has inconsistent lifecycle state");
        }

        boolean targetIsAdministrator = target.getRoles() != null
                && target.getRoles().contains(ADMIN_ROLE);
        if (targetIsAdministrator && enabledAdministrators.size() <= 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The last enabled administrator cannot be deactivated");
        }

        String tombstone = "deactivated-" + target.getId();
        target.setAccountEnabled(false);
        target.setUsername(tombstone);
        target.setEmail(tombstone + "@users.invalid");
        target.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        target.setRoles(new HashSet<>());
        target.markDeactivated(Instant.now(), administrator.getId());

        mfaCredentials.deleteById(target.getId());
        users.saveAndFlush(target);
        auditService.success(
                administrator.getId(), "USER_DEACTIVATE", "USER", target.getId().toString());
    }
}