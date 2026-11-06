// com.betting.backend.auth.JwtUtil.java
package com.betting.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
  private static final int MIN_SECRET_BYTES = 32; // HS256 needs a 256-bit key

  private final Key key;
  private final long EXP_MS = 1000L * 60 * 60 * 12; // 12h

  // Secret comes from the JWT_SECRET env var (or local-secrets.properties in dev)
  public JwtUtil(@Value("${app.jwt.secret:}") String secret) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException(
        "JWT_SECRET must be set and at least " + MIN_SECRET_BYTES + " bytes long");
    }
    this.key = Keys.hmacShaKeyFor(bytes);
  }

  public String generate(String username) {
    return Jwts.builder()
      .setSubject(username)
      .setIssuedAt(new Date())
      .setExpiration(new Date(System.currentTimeMillis() + EXP_MS))
      .signWith(key, SignatureAlgorithm.HS256)
      .compact();
  }

  public String validateAndGetSubject(String token) {
    return Jwts.parserBuilder().setSigningKey(key).build()
      .parseClaimsJws(token).getBody().getSubject();
  }
}
