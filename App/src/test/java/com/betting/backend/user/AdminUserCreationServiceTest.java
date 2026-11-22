package com.betting.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.audit.AuditService;
import com.betting.backend.auth.mfa.AdminMfaService;
import com.betting.backend.user.dto.UserCreateRequest;

class AdminUserCreationServiceTest {

    private UserRepository users;
    private PasswordEncoder passwordEncoder;
    private AdminMfaService adminMfaService;
    private AuditService auditService;
    private AdminUserCreationService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        adminMfaService = mock(AdminMfaService.class);
        auditService = mock(AuditService.class);
        service = new AdminUserCreationService(
                users, passwordEncoder, adminMfaService, auditService);
    }

    @Test
    void missingRolesCreatesNormalizedOrdinaryUserWithoutMfa() {
        User administrator = administrator();
        UserCreateRequest request = request(null, null);
        when(passwordEncoder.encode("long-password")).thenReturn("encoded-password");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });

        User saved = service.create(request, administrator);

        assertThat(saved.getUsername()).isEqualTo("alice");
        assertThat(saved.getEmail()).isEqualTo("alice@example.com");
        assertThat(saved.getRoles()).containsExactly("ROLE_USER");
        verifyNoInteractions(adminMfaService);
        verify(auditService).success(1L, "USER_CREATE", "USER", "42");
    }

    @Test
    void administratorCreationRequiresAndVerifiesFreshMfa() {
        User administrator = administrator();
        UserCreateRequest request = request(Set.of("ROLE_USER", "ROLE_ADMIN"), "123456");
        when(adminMfaService.verify(administrator, "123456")).thenReturn(true);
        when(passwordEncoder.encode("long-password")).thenReturn("encoded-password");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(43L);
            return saved;
        });

        User saved = service.create(request, administrator);

        verify(adminMfaService).requireEnabled(administrator);
        verify(adminMfaService).verify(administrator, "123456");
        assertThat(saved.getRoles()).containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
        verify(auditService).success(1L, "USER_CREATE_ADMIN", "USER", "43");
    }

    @Test
    void invalidAdministratorMfaRejectsBeforeIdentityLookupOrSave() {
        User administrator = administrator();
        UserCreateRequest request = request(Set.of("ROLE_ADMIN"), null);
        when(adminMfaService.verify(administrator, null)).thenReturn(false);

        assertThatThrownBy(() -> service.create(request, administrator))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid MFA code");

        verify(adminMfaService).requireEnabled(administrator);
        verify(auditService).rejected(1L, "USER_CREATE_ADMIN", "USER", "pending");
        verify(users, never()).existsByUsernameIgnoreCase(any(String.class));
        verify(users, never()).save(any(User.class));
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void unsupportedRoleRejectsBeforeMfaOrPersistence() {
        UserCreateRequest request = request(Set.of("ROLE_SUPERUSER"), "123456");

        assertThatThrownBy(() -> service.create(request, administrator()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(exception.getReason()).isEqualTo("Unsupported role");
                });

        verifyNoInteractions(adminMfaService, passwordEncoder, auditService);
        verify(users, never()).save(any(User.class));
    }

    @Test
    void duplicateNormalizedUsernameReturnsConflictWithoutSave() {
        UserCreateRequest request = request(Set.of("ROLE_USER"), null);
        when(users.existsByUsernameIgnoreCase("alice")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request, administrator()))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception -> {
                    assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(exception.getReason()).isEqualTo("Username already taken");
                });

        verify(users, never()).save(any(User.class));
        verifyNoInteractions(passwordEncoder, adminMfaService, auditService);
    }

    @Test
    void savedUserContainsOnlyRequestedAllowlistedRoles() {
        UserCreateRequest request = request(Set.of("ROLE_USER"), null);
        when(passwordEncoder.encode(any(String.class))).thenReturn("encoded-password");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId(44L);
            return saved;
        });

        service.create(request, administrator());

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(users).save(savedUser.capture());
        assertThat(savedUser.getValue().getRoles()).containsExactly("ROLE_USER");
    }

    private static User administrator() {
        User administrator = new User();
        administrator.setId(1L);
        administrator.setUsername("admin");
        administrator.setRoles(Set.of("ROLE_ADMIN"));
        return administrator;
    }

    private static UserCreateRequest request(Set<String> roles, String mfaCode) {
        UserCreateRequest request = new UserCreateRequest();
        request.setUsername("  ALICE  ");
        request.setEmail("  ALICE@EXAMPLE.COM  ");
        request.setPassword("long-password");
        request.setRoles(roles);
        request.setMfaCode(mfaCode);
        return request;
    }
}