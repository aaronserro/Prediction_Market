// com.betting.backend.auth.AuthController.java
package com.betting.backend.auth;

import com.betting.backend.auth.dto.*;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
      .header("Set-Cookie", authCookie(token, false).toString())
      .body(new AuthResponse(u.getUsername()));
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody LoginRequest req) {
    authMgr.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));
    String token = jwt.generate(req.username());
    return ResponseEntity.ok()
      .header("Set-Cookie", authCookie(token, false).toString())
      .body(new AuthResponse(req.username()));
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout() {
    // Clear cookie
    return ResponseEntity.ok()
      .header("Set-Cookie", ResponseCookie.from(AUTH_COOKIE, "")
        .httpOnly(true).secure(false).sameSite("Lax").path("/").maxAge(0).build().toString())
      .build();
  }

  @GetMapping("/me")
  public ResponseEntity<?> me() {
    // If the filter authenticated the request, Spring Security will have a principal
    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) return ResponseEntity.ok().body(null);
    return ResponseEntity.ok().body(new AuthResponse(auth.getName()));
  }

  private ResponseCookie authCookie(String token, boolean prod) {
    return ResponseCookie.from(AUTH_COOKIE, token)
      .httpOnly(true)
      .secure(false)              // set true with HTTPS
      .sameSite("Lax")            // for dev; use "None" + secure(true) if cross-site
      .path("/")
      .maxAge(60 * 60 * 12)
      .build();
  }
}
