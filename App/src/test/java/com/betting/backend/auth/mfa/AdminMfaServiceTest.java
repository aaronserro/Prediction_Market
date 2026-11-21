package com.betting.backend.auth.mfa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.BadCredentialsException;

import com.betting.backend.user.User;

import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;

class AdminMfaServiceTest {

    private static final String ENCRYPTION_KEY =
            "0123456789abcdef0123456789abcdef";

    @Test
    void enrollmentStoresEncryptedSecretAndValidCodeEnablesCredential() throws Exception {
        AdminMfaCredentialRepository repository = mock(AdminMfaCredentialRepository.class);
        AdminMfaService service = new AdminMfaService(repository, ENCRYPTION_KEY);
        User admin = admin();

        AdminMfaService.Enrollment enrollment = service.beginEnrollment(admin);
        ArgumentCaptor<AdminMfaCredential> saved = ArgumentCaptor.forClass(AdminMfaCredential.class);
        verify(repository).save(saved.capture());
        AdminMfaCredential credential = saved.getValue();
        assertThat(credential.getEncryptedSecret()).doesNotContain(enrollment.secret());
        assertThat(credential.isEnabled()).isFalse();

        when(repository.findById(99L)).thenReturn(Optional.of(credential));
        long counter = new SystemTimeProvider().getTime() / 30;
        String code = new DefaultCodeGenerator().generate(enrollment.secret(), counter);
        service.confirmEnrollment(admin, code);

        assertThat(credential.isEnabled()).isTrue();
        assertThat(credential.getVerifiedAt()).isNotNull();
        assertThat(service.verify(admin, code)).isTrue();
    }

    @Test
    void invalidCodeIsRejectedAndCredentialRemainsDisabled() {
        AdminMfaCredentialRepository repository = mock(AdminMfaCredentialRepository.class);
        AdminMfaService service = new AdminMfaService(repository, ENCRYPTION_KEY);
        User admin = admin();
        AdminMfaService.Enrollment enrollment = service.beginEnrollment(admin);
        ArgumentCaptor<AdminMfaCredential> saved = ArgumentCaptor.forClass(AdminMfaCredential.class);
        verify(repository).save(saved.capture());
        when(repository.findById(99L)).thenReturn(Optional.of(saved.getValue()));

        assertThatThrownBy(() -> service.confirmEnrollment(admin, "000000"))
                .isInstanceOf(BadCredentialsException.class);
        assertThat(saved.getValue().isEnabled()).isFalse();
        assertThat(enrollment.secret()).isNotBlank();
    }

    @Test
    void administratorWithoutEnabledEnrollmentIsDenied() {
        AdminMfaCredentialRepository repository = mock(AdminMfaCredentialRepository.class);
        AdminMfaService service = new AdminMfaService(repository, ENCRYPTION_KEY);
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireEnabled(admin()))
                .isInstanceOf(BadCredentialsException.class);
    }

    private User admin() {
        User user = new User();
        user.setId(99L);
        user.setUsername("admin");
        user.setEmail("admin@example.com");
        user.setRoles(Set.of("ROLE_ADMIN"));
        return user;
    }
}
