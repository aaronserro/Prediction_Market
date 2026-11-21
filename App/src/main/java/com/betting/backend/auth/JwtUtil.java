// com.betting.backend.auth.JwtUtil.java
package com.betting.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import com.betting.backend.config.SecurityProperties;
import com.betting.backend.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
  private static final int MIN_SECRET_BYTES = 32; // HS256 needs a 256-bit key

  private final Key key;
  private final SecurityProperties properties;

  // Secret comes from the JWT_SECRET env var (or local-secrets.properties in dev)
  public JwtUtil(@Value("${app.jwt.secret:}") String secret,
                 SecurityProperties properties) {
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException(
        "JWT_SECRET must be set and at least " + MIN_SECRET_BYTES + " bytes long");
    }
    this.key = Keys.hmacShaKeyFor(bytes);
    this.properties = properties;
  }

  public String generate(User user) {
    Date issuedAt = new Date();
    return Jwts.builder()
      .setSubject(user.getId().toString())
      .claim("username", user.getUsername())
      .claim("tokenVersion", user.getTokenVersion())
      .setIssuer(properties.getJwtIssuer())
      .setAudience(properties.getJwtAudience())
      .setId(UUID.randomUUID().toString())
      .setIssuedAt(issuedAt)
      .setExpiration(new Date(issuedAt.getTime() + properties.getJwtLifetime().toMillis()))
      .signWith(key, SignatureAlgorithm.HS256)
      .compact();
  }

  public JwtClaims parseAndValidate(String token) {
    Claims claims = Jwts.parserBuilder()
      .setSigningKey(key)
      .requireIssuer(properties.getJwtIssuer())
      .requireAudience(properties.getJwtAudience())
      .build()
      .parseClaimsJws(token)
      .getBody();

    Long userId = Long.valueOf(claims.getSubject());
    String username = claims.get("username", String.class);
    Object tokenVersionClaim = claims.get("tokenVersion");
    if (username == null || username.isBlank() || !(tokenVersionClaim instanceof Number tokenVersion)) {
      throw new JwtException("Required JWT claims are missing");
    }
    return new JwtClaims(
      userId,
      username,
      tokenVersion.longValue(),
      claims.getIssuer(),
      claims.getAudience(),
      claims.getId(),
      claims.getExpiration());
  }

  public record JwtClaims(Long userId,
                          String username,
                          long tokenVersion,
                          String issuer,
                          String audience,
                          String jwtId,
                          Date expiresAt) {}
}
