package com.betting.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.audit.AuditService;
import com.betting.backend.auth.mfa.AdminMfaCredentialRepository;

class UserLifecycleServiceTest {

    private UserRepository users;
    private AdminMfaCredentialRepository mfaCredentials;
    private PasswordEncoder passwordEncoder;
    private AuditService auditService;
    private UserLifecycleService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        mfaCredentials = mock(AdminMfaCredentialRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        auditService = mock(AuditService.class);
        service = new UserLifecycleService(
                users, mfaCredentials, passwordEncoder, auditService);
    }

    @Test
    void ordinaryUserIsAnonymizedDisabledAndAuditedWithoutDeletion() {
        User administrator = user(1L, "admin", Set.of("ROLE_ADMIN"));
        User target = user(42L, "alice", Set.of("ROLE_USER"));
        target.setEmail("alice@example.com");
        target.setPasswordHash("old-password-hash");
        long previousTokenVersion = target.getTokenVersion();

        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(administrator));
        when(users.findByIdForUpdate(42L)).thenReturn(Optional.of(target));
        when(passwordEncoder.encode(any(String.class))).thenReturn("replacement-password-hash");

        service.deactivateAndAnonymize(42L, administrator);

        assertThat(target.isEnabled()).isFalse();
        assertThat(target.getTokenVersion()).isGreaterThan(previousTokenVersion);
        assertThat(target.getUsername()).isEqualTo("deactivated-42");
        assertThat(target.getEmail()).isEqualTo("deactivated-42@users.invalid");
        assertThat(target.getPasswordHash()).isEqualTo("replacement-password-hash");
        assertThat(target.getRoles()).isEmpty();
        assertThat(target.getDeactivatedAt()).isNotNull();
        assertThat(target.getDeactivatedByUserId()).isEqualTo(1L);

        verify(mfaCredentials).deleteById(42L);
        verify(users).saveAndFlush(target);
        verify(auditService).success(1L, "USER_DEACTIVATE", "USER", "42");
        verify(users, never()).delete(any(User.class));
        verify(users, never()).deleteById(any(Long.class));

        InOrder lockOrder = inOrder(users);
        lockOrder.verify(users).findEnabledAdministratorsForUpdate();
        lockOrder.verify(users).findByIdForUpdate(42L);
    }

    @Test
    void alreadyDeactivatedTargetIsAnIdempotentNoOp() {
        User administrator = user(1L, "admin", Set.of("ROLE_ADMIN"));
        User target = user(42L, "deactivated-42", Set.of());
        target.setAccountEnabled(false);
        target.markDeactivated(Instant.parse("2026-01-01T00:00:00Z"), 1L);

        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(administrator));
        when(users.findByIdForUpdate(42L)).thenReturn(Optional.of(target));

        service.deactivateAndAnonymize(42L, administrator);

        verifyNoInteractions(passwordEncoder, mfaCredentials, auditService);
        verify(users, never()).saveAndFlush(any(User.class));
    }

    @Test
    void administratorCannotDeactivateSelf() {
        User administrator = user(1L, "admin", Set.of("ROLE_ADMIN"));

        assertStatus(
                () -> service.deactivateAndAnonymize(1L, administrator),
                HttpStatus.CONFLICT,
                "Administrators cannot deactivate themselves");

        verifyNoInteractions(users, mfaCredentials, passwordEncoder, auditService);
    }

    @Test
    void lastEnabledAdministratorCannotBeDeactivated() {
        User actingAdministrator = user(1L, "admin-one", Set.of("ROLE_ADMIN"));
        User targetAdministrator = user(2L, "admin-two", Set.of("ROLE_ADMIN"));
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(targetAdministrator));
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(targetAdministrator));

        assertStatus(
                () -> service.deactivateAndAnonymize(2L, actingAdministrator),
                HttpStatus.CONFLICT,
                "The last enabled administrator cannot be deactivated");

        verify(users, never()).saveAndFlush(any(User.class));
        verifyNoInteractions(mfaCredentials, passwordEncoder, auditService);
    }

    @Test
    void administratorCanDeactivateAnotherWhenMultipleAreEnabled() {
        User actingAdministrator = user(1L, "admin-one", Set.of("ROLE_ADMIN"));
        User targetAdministrator = user(2L, "admin-two", Set.of("ROLE_ADMIN"));
        when(users.findEnabledAdministratorsForUpdate())
                .thenReturn(List.of(actingAdministrator, targetAdministrator));
        when(users.findByIdForUpdate(2L)).thenReturn(Optional.of(targetAdministrator));
        when(passwordEncoder.encode(any(String.class))).thenReturn("replacement-password-hash");

        service.deactivateAndAnonymize(2L, actingAdministrator);

        assertThat(targetAdministrator.isEnabled()).isFalse();
        verify(users).saveAndFlush(targetAdministrator);
        verify(auditService).success(1L, "USER_DEACTIVATE", "USER", "2");
    }

    @Test
    void missingTargetReturnsNotFoundWithoutMutation() {
        User administrator = user(1L, "admin", Set.of("ROLE_ADMIN"));
        when(users.findEnabledAdministratorsForUpdate()).thenReturn(List.of(administrator));
        when(users.findByIdForUpdate(404L)).thenReturn(Optional.empty());

        assertStatus(
                () -> service.deactivateAndAnonymize(404L, administrator),
                HttpStatus.NOT_FOUND,
                "User not found");

        verifyNoInteractions(mfaCredentials, passwordEncoder, auditService);
    }

    @Test
    void nullTargetOrAdministratorIdentityReturnsBadRequest() {
        User administratorWithoutId = new User();

        assertStatus(
                () -> service.deactivateAndAnonymize(null, user(1L, "admin", Set.of("ROLE_ADMIN"))),
                HttpStatus.BAD_REQUEST,
                "User ID is required");
        assertStatus(
                () -> service.deactivateAndAnonymize(42L, null),
                HttpStatus.BAD_REQUEST,
                "Authenticated administrator is required");
        assertStatus(
                () -> service.deactivateAndAnonymize(42L, administratorWithoutId),
                HttpStatus.BAD_REQUEST,
                "Authenticated administrator is required");

        verifyNoInteractions(users, mfaCredentials, passwordEncoder, auditService);
    }

    private static User user(Long id, String username, Set<String> roles) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPasswordHash("password-hash");
        user.setRoles(roles);
        return user;
    }

    private static void assertStatus(
            org.assertj.core.api.ThrowableAssert.ThrowingCallable operation,
            HttpStatus expectedStatus,
            String expectedReason) {
        assertThatThrownBy(operation)
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(expectedStatus);
                    assertThat(exception.getReason()).isEqualTo(expectedReason);
                });
    }
}