// com.betting.backend.auth.AuthController.java
package com.betting.backend.auth;
import org.springframework.security.core.Authentication;
import com.betting.backend.auth.dto.*;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import com.betting.backend.auth.MeResponse;
import java.util.Set;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private static final String AUTH_COOKIE = "betauth";

  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final AuthenticationManager authMgr;
  private final JwtUtil jwt;

  public AuthController(UserRepository users, PasswordEncoder encoder, AuthenticationManager authMgr, JwtUtil jwt) {
    this.users = users; this.encoder = encoder; this.authMgr = authMgr; this.jwt = jwt;
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
  public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
    if (users.existsByUsername(req.username())) {
      return ResponseEntity.badRequest().body("Username already taken");
    }
    var u = new User();
    u.setUsername(req.username());
    u.setPasswordHash(encoder.encode(req.password()));
    u.setEmail(req.email());
    u.setRoles(Set.of("ROLE_USER"));
    users.save(u);
    // Auto-login after signup (optional)
    String token = jwt.generate(u.getUsername());
    return ResponseEntity.ok()
      .header("Set-Cookie", authCookie(token).toString())
      .body(new AuthResponse(u.getUsername()));
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    // Clear existing authentication before logging in new user
    SecurityContextHolder.clearContext();

    authMgr.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));
    String token = jwt.generate(req.username());
    return ResponseEntity.ok()
      .header("Set-Cookie", authCookie(token).toString())
      .body(new AuthResponse(req.username()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    boolean isProd = System.getenv("SPRING_PROFILES_ACTIVE") != null
                     && System.getenv("SPRING_PROFILES_ACTIVE").contains("prod");

    ResponseCookie.ResponseCookieBuilder clearCookie = ResponseCookie.from(AUTH_COOKIE, "")
        .httpOnly(true)
        .path("/")
        .maxAge(0);

    if (isProd) {
      clearCookie.secure(true).sameSite("None").domain(".pryzm.ca");
    } else {
      clearCookie.secure(false).sameSite("Lax");
    }

    return ResponseEntity.ok()
      .header("Set-Cookie", clearCookie.build().toString())
      .build();
  }



  private ResponseCookie authCookie(String token) {
    // Detect production by checking if running on HTTPS (api.pryzm.ca)
    boolean isProd = System.getenv("SPRING_PROFILES_ACTIVE") != null
                     && System.getenv("SPRING_PROFILES_ACTIVE").contains("prod");

    ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(AUTH_COOKIE, token)
      .httpOnly(true)
      .path("/")
      .maxAge(60 * 60 * 12);

    if (isProd) {
      // Production: secure cookie with cross-site support and domain set
      builder.secure(true)
             .sameSite("None")
             .domain(".pryzm.ca");  // Share cookie across subdomains
    } else {
      // Development: non-secure cookie for localhost
      builder.secure(false)
             .sameSite("Lax");
    }

    return builder.build();
  }
}
