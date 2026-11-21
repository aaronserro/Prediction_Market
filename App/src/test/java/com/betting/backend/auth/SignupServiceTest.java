package com.betting.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.auth.dto.SignupRequest;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Service.WalletService;

class SignupServiceTest {

    private UserRepository users;
    private PasswordEncoder encoder;
    private WalletService walletService;
    private SignupService service;

    @BeforeEach
    void setUp() {
        users = org.mockito.Mockito.mock(UserRepository.class);
        encoder = org.mockito.Mockito.mock(PasswordEncoder.class);
        walletService = org.mockito.Mockito.mock(WalletService.class);
        service = new SignupService(users, encoder, walletService);

        when(encoder.encode("long-password")).thenReturn("encoded-password");
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
    }

    @Test
    void normalizedIdentityIsSavedWithUserRole() {
        User result = service.signup(new SignupRequest(
                "  Alice_1  ", "long-password", "  Alice@Example.COM  "));

        ArgumentCaptor<User> savedUser = ArgumentCaptor.forClass(User.class);
        verify(users).save(savedUser.capture());
        assertThat(savedUser.getValue().getUsername()).isEqualTo("alice_1");
        assertThat(savedUser.getValue().getEmail()).isEqualTo("alice@example.com");
        assertThat(savedUser.getValue().getPasswordHash()).isEqualTo("encoded-password");
        assertThat(savedUser.getValue().getRoles()).isEqualTo(Set.of("ROLE_USER"));
        assertThat(savedUser.getValue().isEnabled()).isTrue();
        assertThat(savedUser.getValue().getTokenVersion()).isZero();
        assertThat(result).isSameAs(savedUser.getValue());
    }

    @Test
    void duplicateNormalizedUsernameIsRejected() {
        when(users.existsByUsernameIgnoreCase("alice")).thenReturn(true);

        assertThatThrownBy(() -> service.signup(
                new SignupRequest(" Alice ", "long-password", "new@example.com")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Username already taken");

        verify(users, never()).save(any());
        verify(walletService, never()).credit(any(), any(), any(), any());
    }

    @Test
    void duplicateNormalizedEmailIsRejected() {
        when(users.existsByEmailIgnoreCase("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.signup(
                new SignupRequest("new_user", "long-password", " Alice@Example.com ")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already registered");

        verify(users, never()).save(any());
        verify(walletService, never()).credit(any(), any(), any(), any());
    }

    @Test
    void walletAndBonusAreCreatedOnceWithStableKey() {
        service.signup(new SignupRequest("alice", "long-password", "alice@example.com"));

        verify(walletService).getbalance(42L);
        verify(walletService).credit(10_000L, 42L, "SIGNUP_BONUS:42", "SIGNUP_BONUS");
    }

    @Test
    void bonusFailurePropagatesFromTransactionalBoundary() throws Exception {
        when(walletService.credit(any(), any(), any(), any()))
                .thenThrow(new IllegalStateException("wallet unavailable"));

        assertThatThrownBy(() -> service.signup(
                new SignupRequest("alice", "long-password", "alice@example.com")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("wallet unavailable");

        assertThat(SignupService.class.getMethod("signup", SignupRequest.class)
                .isAnnotationPresent(Transactional.class)).isTrue();
    }
}
