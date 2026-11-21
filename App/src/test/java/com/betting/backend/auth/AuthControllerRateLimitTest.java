package com.betting.backend.auth;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
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
import com.betting.backend.auth.mfa.AdminMfaService;
import com.betting.backend.audit.AuditService;
import com.betting.backend.config.SecurityProperties;
import com.betting.backend.user.User;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.http.ResponseEntity;

import com.betting.backend.auth.dto.AuthResponse;

class AuthControllerRateLimitTest {

    private AuthenticationManager authManager;
    private JwtUtil jwt;
        private SignupService signupService;
    private AuthRateLimiter rateLimiter;
        private AdminMfaService adminMfaService;
        private AuditService auditService;
    private HttpServletRequest request;
    private AuthController controller;

    @BeforeEach
    void setUp() {
        authManager = mock(AuthenticationManager.class);
        jwt = mock(JwtUtil.class);
        signupService = mock(SignupService.class);
        rateLimiter = mock(AuthRateLimiter.class);
        adminMfaService = mock(AdminMfaService.class);
        auditService = mock(AuditService.class);
        request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("203.0.113.10");
        controller = new AuthController(
                        authManager, jwt, signupService, rateLimiter, new SecurityProperties(),
                        adminMfaService, auditService);
    }

    @Test
    void blockedSignupDoesNotCreateOrCreditAUser() {
        SignupRequest body = new SignupRequest("alice", "long-password", "alice@example.com");
        org.mockito.Mockito.doThrow(new RateLimitExceededException("signup-hour", 60))
                .when(rateLimiter).checkSignup("203.0.113.10");

        assertThatThrownBy(() -> controller.signup(body, request))
                .isInstanceOf(RateLimitExceededException.class);

        verifyNoInteractions(signupService, jwt);
    }

        @Test
        void successfulSignupReturnsIdentityAndKeepsJwtInCookie() {
                SignupRequest body = new SignupRequest("alice", "long-password", "alice@example.com");
                User user = new User();
                user.setId(7L);
                user.setUsername("alice");
                when(signupService.signup(body)).thenReturn(user);
                when(jwt.generate(user)).thenReturn("token");

                ResponseEntity<?> response = controller.signup(body, request);

                assertThat(response.getBody()).isEqualTo(new AuthResponse("alice"));
                assertThat(response.getHeaders().getFirst("Set-Cookie"))
                                .contains("betauth=token")
                                .contains("HttpOnly");
                assertThat(response.getBody().toString()).doesNotContain("token");
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
        User user = new User();
        user.setId(7L);
        user.setUsername("alice");
        user.setRoles(java.util.Set.of("ROLE_USER"));
        when(authManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
        when(jwt.generate(user)).thenReturn("token");

        ResponseEntity<?> response = controller.login(body, request);

        verify(rateLimiter).clearLoginFailures("alice");
        verify(rateLimiter, never()).recordLoginFailure("alice");
        assertThat(response.getBody()).isEqualTo(new AuthResponse("alice"));
        assertThat(response.getHeaders().getFirst("Set-Cookie"))
            .contains("betauth=token")
            .contains("HttpOnly")
            .contains("SameSite=Lax")
            .doesNotContain("Domain=");
    }

    @Test
    void administratorWithoutMfaEnrollmentCannotReceiveJwt() {
        LoginRequest body = new LoginRequest("admin", "correct-password", "123456");
        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        admin.setRoles(java.util.Set.of("ROLE_ADMIN"));
        when(authManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(admin, null, admin.getAuthorities()));
        org.mockito.Mockito.doThrow(new BadCredentialsException("MFA required"))
                .when(adminMfaService).requireEnabled(admin);

        assertThatThrownBy(() -> controller.login(body, request))
                .isInstanceOf(BadCredentialsException.class);

        verify(auditService).rejected(99L, "ADMIN_LOGIN", "USER", "99");
        verify(jwt, never()).generate(admin);
        verify(rateLimiter).recordLoginFailure("admin");
        verify(rateLimiter, never()).clearLoginFailures("admin");
    }

    @Test
    void administratorWithValidMfaCanReceiveJwt() {
        LoginRequest body = new LoginRequest("admin", "correct-password", "123456");
        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        admin.setRoles(java.util.Set.of("ROLE_ADMIN"));
        when(authManager.authenticate(any())).thenReturn(
                new UsernamePasswordAuthenticationToken(admin, null, admin.getAuthorities()));
        when(adminMfaService.verify(admin, "123456")).thenReturn(true);
        when(jwt.generate(admin)).thenReturn("token");

        ResponseEntity<?> response = controller.login(body, request);

        verify(adminMfaService).requireEnabled(admin);
        verify(auditService).success(99L, "ADMIN_LOGIN", "USER", "99");
        verify(rateLimiter).clearLoginFailures("admin");
        assertThat(response.getHeaders().getFirst("Set-Cookie")).contains("betauth=token");
    }
}
