// com.betting.backend.auth.JwtUtil.java
package com.betting.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
  // For prod, load from ENV/Secrets Manager
  private final Key key = Keys.hmacShaKeyFor("REPLACE_WITH_32+_CHAR_SUPER_SECRET_KEY".getBytes());
  private final long EXP_MS = 1000L * 60 * 60 * 12; // 12h

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
