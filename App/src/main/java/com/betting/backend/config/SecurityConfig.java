// src/main/java/com/betting/backend/config/SecurityConfig.java
package com.betting.backend.config;

import com.betting.backend.auth.JwtUtil;
import com.betting.backend.user.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Configuration
public class SecurityConfig {

  private static final String AUTH_COOKIE = "betauth";

  @Bean
  PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

  @Bean
  UserDetailsService userDetailsService(UserRepository repo) {
    return username -> repo.findByUsername(username)
      .map(u -> org.springframework.security.core.userdetails.User // avoid clash with your entity
        .withUsername(u.getUsername())
        .password(u.getPasswordHash())
        // Map Set<String> roles to String[] for authorities(...)
        .authorities(u.getRoles() == null
            ? new String[] {}
            : u.getRoles().toArray(new String[0]))
        .build())
      .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
  }

  @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();
  }

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http, JwtUtil jwtUtil, UserDetailsService uds) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(cors -> cors.configurationSource(corsConfig()))
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.POST, "/auth/signup", "/auth/login").permitAll()
        .requestMatchers(HttpMethod.GET, "/auth/me").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/users/*/wallet").permitAll()
        .anyRequest().authenticated()
      )
      .formLogin(form -> form.disable())
      .addFilterBefore(new JwtCookieFilter(jwtUtil, uds), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  CorsConfigurationSource corsConfig() {
    var cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("Content-Type","Authorization"));
    cfg.setAllowCredentials(true);
    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }

  // --- Reads JWT from HTTP-only cookie and authenticates the request ---
  static class JwtCookieFilter extends OncePerRequestFilter {
    private final JwtUtil jwt;
    private final UserDetailsService uds;

    JwtCookieFilter(JwtUtil jwt, UserDetailsService uds) {
      this.jwt = jwt; this.uds = uds;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

      String token = null;
      Cookie[] cookies = req.getCookies();
      if (cookies != null) {
        for (Cookie c : cookies) {
          if (AUTH_COOKIE.equals(c.getName())) {
            token = c.getValue();
            break;
          }
        }
      }

      if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        try {
          String username = jwt.validateAndGetSubject(token);
          UserDetails user = uds.loadUserByUsername(username);
          var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
          SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception ignored) {
          // invalid/expired token -> ignore; request remains unauthenticated
        }
      }

      chain.doFilter(req, res);
    }
  }
}
