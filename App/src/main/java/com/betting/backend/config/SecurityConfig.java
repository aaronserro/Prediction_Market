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
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  UserDetailsService userDetailsService(UserRepository repo) {
    return username -> repo.findByUsername(username)
      .map(u -> (UserDetails) u) // User now implements UserDetails
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
        // 🔑 Allow preflight requests
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/auth/**", "/api/v1/auth/**").permitAll()
        // Public auth endpoints
        .requestMatchers(HttpMethod.POST, "/auth/signup", "/auth/login", "/auth/logout").permitAll()
        .requestMatchers(HttpMethod.GET, "/auth/me").permitAll()
        .requestMatchers("/auth/**").permitAll()
        .requestMatchers("/api/v1/auth/**").permitAll()

        // Admin endpoints (must come before other /api/v1/** rules)
        .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")

        // Public market GET endpoints - anyone can view markets
        .requestMatchers(HttpMethod.GET, "/api/v1/markets/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/users/*/wallet").permitAll()

        // Authenticated endpoints - must be logged in
        .requestMatchers(HttpMethod.POST, "/api/v1/trades/**").authenticated()
        .requestMatchers(HttpMethod.GET, "/api/v1/trades/**").authenticated()

        // Everything else requires auth
        .anyRequest().authenticated()
      )
      .formLogin(form -> form.disable())
      .addFilterBefore(new JwtCookieFilter(jwtUtil, uds), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // CORS configuration for allowing frontend origins
  CorsConfigurationSource corsConfig() {
    var cfg = new CorsConfiguration();

    // ✅ Frontend origins allowed to call your API
    cfg.setAllowedOrigins(List.of(
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://app.pryzm.ca",     // existing prod frontend
        "https://www.pryzm.ca",     // 👈 your live site (causing the current error)
        "https://pryzm.ca"          // optional bare domain, useful if you ever use it
    ));

    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

    cfg.setAllowedHeaders(List.of(
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept"
    ));

    // You’re using a JWT cookie -> must allow credentials
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
      this.jwt = jwt;
      this.uds = uds;
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
