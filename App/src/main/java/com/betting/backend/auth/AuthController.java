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

  // TEMPORARY: Add ADMIN role to current user (for development only)
  @PostMapping("/make-admin")
  public ResponseEntity<?> makeAdmin(Authentication auth) {
    if (auth == null || !auth.isAuthenticated()) {
      return ResponseEntity.status(401).body("Not authenticated");
    }
    
    String username = auth.getName();
    User user = users.findByUsername(username).orElseThrow();
    
    // Add ROLE_ADMIN to existing roles
    Set<String> roles = user.getRoles();
    if (roles == null) {
      roles = Set.of("ROLE_USER", "ROLE_ADMIN");
    } else {
      roles = new java.util.HashSet<>(roles);
      roles.add("ROLE_ADMIN");
    }
    user.setRoles(roles);
    users.save(user);
    
    // Generate new token with updated roles
    String token = jwt.generate(user.getUsername());
    return ResponseEntity.ok()
      .header("Set-Cookie", authCookie(token, false).toString())
      .body("Admin role added. Please refresh.");
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
