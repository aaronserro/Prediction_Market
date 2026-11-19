package com.betting.backend.auth;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.betting.backend.auth.dto.LoginRequest;
import com.betting.backend.auth.dto.SignupRequest;
import com.betting.backend.auth.ratelimit.AuthRateLimiter;
import com.betting.backend.auth.ratelimit.RateLimitExceededException;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Service.WalletService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthControllerRateLimitTest {

    private UserRepository users;
    private PasswordEncoder encoder;
    private AuthenticationManager authManager;
    private JwtUtil jwt;
    private WalletService walletService;
    private AuthRateLimiter rateLimiter;
    private HttpServletRequest request;
    private AuthController controller;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        authManager = mock(AuthenticationManager.class);
        jwt = mock(JwtUtil.class);
        walletService = mock(WalletService.class);
        rateLimiter = mock(AuthRateLimiter.class);
        request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        controller = new AuthController(users, encoder, authManager, jwt, walletService, rateLimiter);
    }

    @Test
    void blockedSignupDoesNotCreateOrCreditAUser() {
        SignupRequest body = new SignupRequest("alice", "long-password", "alice@example.com");
        org.mockito.Mockito.doThrow(new RateLimitExceededException("signup-hour", 60))
                .when(rateLimiter).checkSignup("203.0.113.10");

        assertThatThrownBy(() -> controller.signup(body, request))
                .isInstanceOf(RateLimitExceededException.class);

        verifyNoInteractions(users, encoder, walletService, jwt);
    }

    @Test
    void blockedLoginDoesNotInvokeAuthentication() {
        LoginRequest body = new LoginRequest("alice", "wrong-password");
        org.mockito.Mockito.doThrow(new RateLimitExceededException("login-ip", 30))
                .when(rateLimiter).checkLogin("203.0.113.10", "alice");

        assertThatThrownBy(() -> controller.login(body, request))
                .isInstanceOf(RateLimitExceededException.class);

        verifyNoInteractions(authManager, jwt);
    }

    @Test
    void failedAuthenticationIsRecorded() {
        LoginRequest body = new LoginRequest("alice", "wrong-password");
        when(authManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));

        assertThatThrownBy(() -> controller.login(body, request))
                .isInstanceOf(BadCredentialsException.class);

        verify(rateLimiter).recordLoginFailure("alice");
        verify(rateLimiter, never()).clearLoginFailures("alice");
    }

    @Test
    void successfulAuthenticationClearsAccountFailures() {
        LoginRequest body = new LoginRequest("alice", "correct-password");
        when(jwt.generate("alice")).thenReturn("token");

        controller.login(body, request);

        verify(rateLimiter).clearLoginFailures("alice");
        verify(rateLimiter, never()).recordLoginFailure("alice");
    }
}
