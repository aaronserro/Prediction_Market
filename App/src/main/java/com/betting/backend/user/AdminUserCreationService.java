package com.betting.backend.user;

import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.audit.AuditService;
import com.betting.backend.auth.mfa.AdminMfaService;
import com.betting.backend.user.dto.UserCreateRequest;

@Service
public class AdminUserCreationService {

    private static final String ADMIN_ROLE = "ROLE_ADMIN";
    private static final Set<String> ALLOWED_ROLES = Set.of("ROLE_USER", ADMIN_ROLE);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AdminMfaService adminMfaService;
    private final AuditService auditService;

    public AdminUserCreationService(UserRepository users,
                                    PasswordEncoder passwordEncoder,
                                    AdminMfaService adminMfaService,
                                    AuditService auditService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.adminMfaService = adminMfaService;
        this.auditService = auditService;
    }

    @Transactional
    public User create(UserCreateRequest request, User administrator) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (administrator == null || administrator.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Authenticated administrator is required");
        }

        Set<String> roles = request.getRoles() == null || request.getRoles().isEmpty()
                ? Set.of("ROLE_USER")
                : Set.copyOf(request.getRoles());
        if (!ALLOWED_ROLES.containsAll(roles)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported role");
        }

        boolean createsAdministrator = roles.contains(ADMIN_ROLE);
        if (createsAdministrator) {
            adminMfaService.requireEnabled(administrator);
            if (!adminMfaService.verify(administrator, request.getMfaCode())) {
                auditService.rejected(
                        administrator.getId(), "USER_CREATE_ADMIN", "USER", "pending");
                throw new BadCredentialsException("Invalid MFA code");
            }
        }

        String username = normalizeRequired(request.getUsername(), "Username is required");
        String email = normalizeRequired(request.getEmail(), "Email is required");
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);
        user.setRoles(roles);

        User saved = users.save(user);
        auditService.success(
                administrator.getId(),
                createsAdministrator ? "USER_CREATE_ADMIN" : "USER_CREATE",
                "USER",
                saved.getId().toString());
        return saved;
    }

    private static String normalizeRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}