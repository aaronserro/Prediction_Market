package com.betting.backend.config;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.betting.backend.auth.JwtUtil;
import com.betting.backend.user.UserRepository;
@WebMvcTest(SecurityTestController.class)
@Import({SecurityConfig.class, CorsConfig.class, SecurityProperties.class})
@ContextConfiguration(classes = SecurityTestController.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository users;

    @MockitoBean
    private JwtUtil jwt;

    @Test
    void stateChangingRequestWithoutCsrfTokenIsRejected() throws Exception {
        mvc.perform(post("/auth/login"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validCsrfTokenPermitsPublicStateChangingRequest() throws Exception {
        mvc.perform(post("/auth/login").with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void csrfHandshakeCreatesReadableTokenCookie() throws Exception {
        mvc.perform(get("/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    void onlyExplicitAuthenticationRoutesArePublic() throws Exception {
        mvc.perform(get("/auth/me"))
                .andExpect(status().isOk());

        mvc.perform(get("/auth/private"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void administratorRoutesRequireAdministratorAuthority() throws Exception {
        mvc.perform(get("/api/v1/admin/test")
                        .with(user("member").roles("USER")))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/admin/test")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void approvedOriginReceivesCredentialedCorsHeaders() throws Exception {
        mvc.perform(options("/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"))
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"));
    }

    @Test
    void unapprovedOriginReceivesNoCredentialedCorsHeaders() throws Exception {
        mvc.perform(options("/auth/login")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));
    }

    @Test
    void hardenedResponseHeadersArePresent() throws Exception {
        mvc.perform(get("/auth/me").secure(true))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Security-Policy",
                        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"))
                .andExpect(header().exists("Strict-Transport-Security"));
    }
}

@RestController
@RequestMapping
class SecurityTestController {

    @PostMapping("/auth/login")
    Map<String, String> login() {
        return Map.of("status", "ok");
    }

    @GetMapping("/auth/me")
    Map<String, String> me() {
        return Map.of("status", "ok");
    }

    @GetMapping("/auth/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @GetMapping("/auth/private")
    Map<String, String> privateAuthRoute() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/v1/admin/test")
    Map<String, String> admin() {
        return Map.of("status", "ok");
    }
}
