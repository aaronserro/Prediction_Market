package com.betting.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.betting.backend.config.CorsConfig;
import com.betting.backend.config.SecurityConfig;
import com.betting.backend.config.SecurityProperties;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.IncorrectClaimException;

@WebMvcTest(JwtTestController.class)
@Import({SecurityConfig.class, CorsConfig.class, SecurityProperties.class, JwtUtil.class})
@ContextConfiguration(classes = JwtTestController.class)
@TestPropertySource(properties =
        "app.jwt.secret=0123456789abcdef0123456789abcdef")
class JwtSecurityTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtUtil jwt;

    @Autowired
    private SecurityProperties properties;

    @MockitoBean
    private UserRepository users;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @BeforeEach
    void resetSecurityProperties() {
        properties.setJwtLifetime(Duration.ofMinutes(15));
        properties.setJwtIssuer("pryzm-api");
        properties.setJwtAudience("pryzm-web");
    }

    @Test
    void tokenContainsAndValidatesRequiredClaims() {
        User user = user(41L, 3L, true);

        String token = jwt.generate(user);
        JwtUtil.JwtClaims claims = jwt.parseAndValidate(token);

        assertThat(claims.userId()).isEqualTo(41L);
        assertThat(claims.username()).isEqualTo("alice");
        assertThat(claims.tokenVersion()).isEqualTo(3L);
        assertThat(claims.issuer()).isEqualTo("pryzm-api");
        assertThat(claims.audience()).isEqualTo("pryzm-web");
        assertThat(claims.jwtId()).isNotBlank();
        assertThat(claims.expiresAt().toInstant())
                .isAfter(Instant.now().plus(Duration.ofMinutes(14)));
    }

    @Test
    void expiredTokenIsRejected() {
        properties.setJwtLifetime(Duration.ofSeconds(-1));
        String token = jwt.generate(user(41L, 0L, true));
        properties.setJwtLifetime(Duration.ofMinutes(15));

        assertThatThrownBy(() -> jwt.parseAndValidate(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    void wrongIssuerOrAudienceIsRejected() {
        String token = jwt.generate(user(41L, 0L, true));
        properties.setJwtAudience("different-audience");

        assertThatThrownBy(() -> jwt.parseAndValidate(token))
                .isInstanceOf(IncorrectClaimException.class);
    }

    @Test
    void currentEnabledUserAndTokenVersionAuthenticate() throws Exception {
        User user = user(41L, 2L, true);
        String token = jwt.generate(user);
        when(users.findByIdAndAccountEnabledTrue(41L)).thenReturn(Optional.of(user));

        mvc.perform(get("/protected").cookie(new Cookie("betauth", token)))
                .andExpect(status().isOk());
    }

    @Test
    void tokenVersionChangeInvalidatesExistingToken() throws Exception {
        User original = user(41L, 2L, true);
        String token = jwt.generate(original);
        User changed = user(41L, 3L, true);
        when(users.findByIdAndAccountEnabledTrue(41L)).thenReturn(Optional.of(changed));

        mvc.perform(get("/protected").cookie(new Cookie("betauth", token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void securityStateChangesIncrementTokenVersion() {
        User user = user(41L, 2L, true);

        user.setRoles(Set.of("ROLE_ADMIN"));
        user.setPasswordHash("new-encoded-password");
        user.setAccountEnabled(false);

        assertThat(user.getTokenVersion()).isEqualTo(5L);
        assertThat(user.isEnabled()).isFalse();
    }

    @Test
    void disabledOrDeletedUserCannotAuthenticate() throws Exception {
        String token = jwt.generate(user(41L, 0L, true));
        when(users.findByIdAndAccountEnabledTrue(41L)).thenReturn(Optional.empty());

        mvc.perform(get("/protected").cookie(new Cookie("betauth", token)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deactivatedUserCannotAuthenticateWithExistingToken() throws Exception {
        User user = user(41L, 2L, true);
        String token = jwt.generate(user);

        user.setAccountEnabled(false);
        user.markDeactivated(Instant.parse("2026-01-01T00:00:00Z"), 7L);
        when(users.findByIdAndAccountEnabledTrue(41L)).thenReturn(Optional.empty());

        mvc.perform(get("/protected").cookie(new Cookie("betauth", token)))
                .andExpect(status().isUnauthorized());
    }

    private User user(Long id, long tokenVersion, boolean enabled) {
        User user = new User();
        user.setId(id);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPasswordHash("encoded-password");
        user.setRoles(Set.of("ROLE_USER"));
        user.setTokenVersion(tokenVersion);
        user.setAccountEnabled(enabled);
        return user;
    }
}

@RestController
class JwtTestController {

    @GetMapping("/protected")
    String protectedRoute() {
        return "ok";
    }
}
