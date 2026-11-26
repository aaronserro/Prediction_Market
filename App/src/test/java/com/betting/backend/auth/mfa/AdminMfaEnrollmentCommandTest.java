package com.betting.backend.auth.mfa;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.context.ConfigurableApplicationContext;

import com.betting.backend.audit.AuditService;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

class AdminMfaEnrollmentCommandTest {

    private final UserRepository users = mock(UserRepository.class);
    private final AdminMfaService mfaService = mock(AdminMfaService.class);
    private final AuditService auditService = mock(AuditService.class);
    private final ConfigurableApplicationContext context =
            mock(ConfigurableApplicationContext.class);

    @Test
    void beginCreatesPendingEnrollmentForEnabledAdministrator() {
        User admin = admin();
        when(users.findByUsernameIgnoreCase("PryzmAdmin")).thenReturn(Optional.of(admin));
        when(mfaService.beginEnrollment(admin))
                .thenReturn(new AdminMfaService.Enrollment("BASE32SECRET"));

        command("begin", "").execute();

        verify(mfaService).isEnabled(admin);
        verify(mfaService).beginEnrollment(admin);
        verify(auditService).success(
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.eq("ADMIN_MFA_ENROLL_BEGIN"),
                org.mockito.ArgumentMatchers.eq("USER"),
                org.mockito.ArgumentMatchers.eq("2"),
                anyString());
    }

    @Test
    void beginRefusesToReplaceEnabledEnrollment() {
        User admin = admin();
        when(users.findByUsernameIgnoreCase("PryzmAdmin")).thenReturn(Optional.of(admin));
        when(mfaService.isEnabled(admin)).thenReturn(true);

        assertThatThrownBy(() -> command("begin", "").execute())
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Administrator MFA is already enabled");

        verify(mfaService, never()).beginEnrollment(admin);
    }

    @Test
    void confirmEnablesPendingEnrollment() {
        User admin = admin();
        when(users.findByUsernameIgnoreCase("PryzmAdmin")).thenReturn(Optional.of(admin));

        command("confirm", "123456").execute();

        verify(mfaService).confirmEnrollment(admin, "123456");
        verify(auditService).success(
                org.mockito.ArgumentMatchers.eq(2L),
                org.mockito.ArgumentMatchers.eq("ADMIN_MFA_ENROLL_CONFIRM"),
                org.mockito.ArgumentMatchers.eq("USER"),
                org.mockito.ArgumentMatchers.eq("2"),
                anyString());
    }

    @Test
    void rejectsMalformedConfirmationCode() {
        when(users.findByUsernameIgnoreCase("PryzmAdmin"))
                .thenReturn(Optional.of(admin()));

        assertThatThrownBy(() -> command("confirm", "12345").execute())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Confirmation code must contain exactly six digits");

        verify(mfaService, never()).confirmEnrollment(
                org.mockito.ArgumentMatchers.any(), anyString());
    }

    @Test
    void rejectsAccountWithoutAdministratorRole() {
        User ordinaryUser = admin();
        ordinaryUser.setRoles(Set.of("ROLE_USER"));
        when(users.findByUsernameIgnoreCase("PryzmAdmin"))
                .thenReturn(Optional.of(ordinaryUser));

        assertThatThrownBy(() -> command("begin", "").execute())
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Account does not have ROLE_ADMIN");
    }

    private AdminMfaEnrollmentCommand command(String action, String code) {
        return new AdminMfaEnrollmentCommand(
                users, mfaService, auditService, context,
                action, " PryzmAdmin ", code);
    }

    private static User admin() {
        User user = new User();
        user.setId(2L);
        user.setUsername("PryzmAdmin");
        user.setEmail("admin@example.com");
        user.setRoles(Set.of("ROLE_USER", "ROLE_ADMIN"));
        return user;
    }
}