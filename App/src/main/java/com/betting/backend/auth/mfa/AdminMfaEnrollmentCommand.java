package com.betting.backend.auth.mfa;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriUtils;

import com.betting.backend.audit.AuditService;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

/**
 * Operator-only, one-shot command for enrolling an existing administrator in
 * TOTP MFA. This component is absent during normal application startup.
 */
@Component
@ConditionalOnProperty(name = "app.admin-mfa-command.action")
public class AdminMfaEnrollmentCommand {

    private final UserRepository users;
    private final AdminMfaService mfaService;
    private final AuditService auditService;
    private final ConfigurableApplicationContext context;
    private final String action;
    private final String username;
    private final String code;

    public AdminMfaEnrollmentCommand(
            UserRepository users,
            AdminMfaService mfaService,
            AuditService auditService,
            ConfigurableApplicationContext context,
            @Value("${app.admin-mfa-command.action}") String action,
            @Value("${app.admin-mfa-command.username:}") String username,
            @Value("${app.admin-mfa-command.code:}") String code) {
        this.users = users;
        this.mfaService = mfaService;
        this.auditService = auditService;
        this.context = context;
        this.action = action;
        this.username = username;
        this.code = code;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void run() {
        int exitCode;
        try {
            execute();
            exitCode = 0;
        } catch (RuntimeException exception) {
            System.err.println("Administrator MFA command failed: " + exception.getMessage());
            exitCode = 1;
        }

        int finalExitCode = exitCode;
        System.exit(SpringApplication.exit(context, () -> finalExitCode));
    }

    void execute() {
        User administrator = users.findByUsernameIgnoreCase(requireUsername())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Administrator account was not found"));
        requireActiveAdministrator(administrator);

        switch (action.trim().toLowerCase(Locale.ROOT)) {
            case "begin" -> begin(administrator);
            case "confirm" -> confirm(administrator);
            default -> throw new IllegalArgumentException("Action must be begin or confirm");
        }
    }

    private void begin(User administrator) {
        if (mfaService.isEnabled(administrator)) {
            throw new IllegalStateException("Administrator MFA is already enabled");
        }

        AdminMfaService.Enrollment enrollment = mfaService.beginEnrollment(administrator);
        auditService.success(
                administrator.getId(),
                "ADMIN_MFA_ENROLL_BEGIN",
                "USER",
                administrator.getId().toString(),
                correlationId());

        String label = UriUtils.encodePathSegment(
                "Pryzm:" + administrator.getUsername(), StandardCharsets.UTF_8);
        String issuer = UriUtils.encodeQueryParam("Pryzm", StandardCharsets.UTF_8);
        String uri = "otpauth://totp/" + label
                + "?secret=" + enrollment.secret()
                + "&issuer=" + issuer
                + "&algorithm=SHA1&digits=6&period=30";

        System.out.println();
        System.out.println("Administrator MFA enrollment started.");
        System.out.println("Username: " + administrator.getUsername());
        System.out.println("Manual TOTP secret:");
        System.out.println(enrollment.secret());
        System.out.println();
        System.out.println("Authenticator URI:");
        System.out.println(uri);
        System.out.println();
        System.out.println("Add this secret to an authenticator, then run the confirm action.");
    }

    private void confirm(User administrator) {
        String normalizedCode = code == null ? "" : code.trim();
        if (!normalizedCode.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException(
                    "Confirmation code must contain exactly six digits");
        }

        String correlationId = correlationId();
        try {
            mfaService.confirmEnrollment(administrator, normalizedCode);
            auditService.success(
                    administrator.getId(),
                    "ADMIN_MFA_ENROLL_CONFIRM",
                    "USER",
                    administrator.getId().toString(),
                    correlationId);
        } catch (RuntimeException exception) {
            auditService.rejected(
                    administrator.getId(),
                    "ADMIN_MFA_ENROLL_CONFIRM",
                    "USER",
                    administrator.getId().toString(),
                    correlationId);
            throw exception;
        }

        System.out.println("Administrator MFA was successfully enabled for "
                + administrator.getUsername());
    }

    private String requireUsername() {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Administrator username is required");
        }
        return username.trim();
    }

    private static void requireActiveAdministrator(User user) {
        if (!user.isAccountEnabled()) {
            throw new IllegalStateException("Administrator account is disabled");
        }

        boolean administrator = user.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
        if (!administrator) {
            throw new IllegalArgumentException("Account does not have ROLE_ADMIN");
        }
    }

    private static String correlationId() {
        return "admin-mfa-cli-" + UUID.randomUUID();
    }
}