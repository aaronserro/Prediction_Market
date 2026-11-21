// com.betting.backend.auth.AuthController.java
package com.betting.backend.auth;
import com.betting.backend.auth.ratelimit.AuthRateLimiter;
import com.betting.backend.auth.mfa.AdminMfaService;
import com.betting.backend.audit.AuditService;
import com.betting.backend.config.SecurityProperties;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import com.betting.backend.auth.dto.*;
import com.betting.backend.user.User;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthenticationManager authMgr;
  private final JwtUtil jwt;
  private final SignupService signupService;
  private final AuthRateLimiter rateLimiter;
  private final SecurityProperties securityProperties;
  private final AdminMfaService adminMfaService;
  private final AuditService auditService;

  public AuthController(AuthenticationManager authMgr,
                        JwtUtil jwt,
                        SignupService signupService,
                        AuthRateLimiter rateLimiter,
                        SecurityProperties securityProperties,
                        AdminMfaService adminMfaService,
                        AuditService auditService) {
    this.authMgr = authMgr;
    this.jwt = jwt;
    this.signupService = signupService;
    this.rateLimiter = rateLimiter;
    this.securityProperties = securityProperties;
    this.adminMfaService = adminMfaService;
    this.auditService = auditService;
  }
  @GetMapping("/csrf")
  public Map<String, String> csrf(CsrfToken token) {
    return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
  }

  @GetMapping("/me")
  public ResponseEntity<MeResponse> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            // not logged in – return empty info
            return ResponseEntity.ok(new MeResponse(null, null, List.of()));
        }

        String username = auth.getName();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // e.g. "ROLE_USER", "ROLE_ADMIN"
                .toList();

        Long userId = null;
        if (auth.getPrincipal() instanceof User user) {
            userId = user.getId();
        }

        return ResponseEntity.ok(new MeResponse(userId, username, roles));
    }
  @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req,
                                    HttpServletRequest request) {
      rateLimiter.checkSignup(request.getRemoteAddr());

    User u = signupService.signup(req);
    String token = jwt.generate(u);
    return ResponseEntity.ok()
      .header("Set-Cookie", authCookie(token).toString())
      .body(new AuthResponse(u.getUsername()));
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req,
                                 HttpServletRequest request) {
    rateLimiter.checkLogin(request.getRemoteAddr(), req.username());

    // Clear existing authentication before logging in new user
    SecurityContextHolder.clearContext();

    try {
      Authentication authentication = authMgr.authenticate(
          new UsernamePasswordAuthenticationToken(req.username(), req.password()));
      if (!(authentication.getPrincipal() instanceof User user)) {
        throw new AuthenticationServiceException("Authenticated account state unavailable");
      }
      if (isAdministrator(user)) {
        try {
          adminMfaService.requireEnabled(user);
          if (!adminMfaService.verify(user, req.mfaCode())) {
            throw new BadCredentialsException("Invalid MFA code");
          }
        } catch (AuthenticationException ex) {
          auditService.rejected(user.getId(), "ADMIN_LOGIN", "USER", user.getId().toString());
          throw ex;
        }
        auditService.success(user.getId(), "ADMIN_LOGIN", "USER", user.getId().toString());
      }
      rateLimiter.clearLoginFailures(req.username());
      String token = jwt.generate(user);
      return ResponseEntity.ok()
        .header("Set-Cookie", authCookie(token).toString())
        .body(new AuthResponse(user.getUsername()));
    } catch (AuthenticationException ex) {
      rateLimiter.recordLoginFailure(req.username());
      throw ex;
    }
  }

  private boolean isAdministrator(User user) {
    return user.getAuthorities().stream()
        .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    ResponseCookie.ResponseCookieBuilder clearCookie = ResponseCookie.from(
            securityProperties.getCookieName(), "")
        .httpOnly(true)
        .secure(securityProperties.isCookieSecure())
        .sameSite(securityProperties.getCookieSameSite())
        .path("/")
        .maxAge(0);

    return ResponseEntity.ok()
      .header("Set-Cookie", clearCookie.build().toString())
      .build();
  }



  private ResponseCookie authCookie(String token) {
    return ResponseCookie.from(securityProperties.getCookieName(), token)
      .httpOnly(true)
      .secure(securityProperties.isCookieSecure())
      .sameSite(securityProperties.getCookieSameSite())
      .path("/")
      .maxAge(securityProperties.getJwtLifetime())
      .build();
  }
}
