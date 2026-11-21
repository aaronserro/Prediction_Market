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
import org.springframework.http.HttpStatus;
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
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  UserDetailsService userDetailsService(UserRepository repo) {
    return username -> repo.findByUsernameIgnoreCase(username.trim())
      .map(u -> (UserDetails) u) // User now implements UserDetails
      .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
  }

  @Bean
  AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
    return cfg.getAuthenticationManager();
  }

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http,
                                  JwtUtil jwtUtil,
                                  UserRepository users,
                                  SecurityProperties properties,
                                  CorsConfigurationSource corsConfigurationSource) throws Exception {
    CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
    csrfRepository.setCookiePath("/");
    csrfRepository.setCookieCustomizer(cookie -> cookie
        .secure(properties.isCookieSecure())
        .sameSite(properties.getCookieSameSite()));

    http
      .csrf(csrf -> csrf.csrfTokenRepository(csrfRepository))
      .cors(cors -> cors.configurationSource(corsConfigurationSource))
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/auth/signup", "/auth/login", "/auth/logout").permitAll()
        .requestMatchers(HttpMethod.GET, "/auth/me", "/auth/csrf").permitAll()

        // Admin endpoints (must come before other /api/v1/** rules)
        .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")

        // Admin-only user management endpoints
        .requestMatchers("/api/v1/users", "/api/v1/users/*").hasAuthority("ROLE_ADMIN")

        // Public market GET endpoints - anyone can view markets
        .requestMatchers(HttpMethod.GET, "/api/v1/markets/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/news/**").permitAll()

        // Minting funds directly is admin-only; users go through fund requests.
        // Other wallet endpoints require login + ownership (checked in WalletController).
        .requestMatchers(HttpMethod.POST, "/api/v1/users/*/wallet/deposit").hasAuthority("ROLE_ADMIN")

        // Authenticated endpoints - must be logged in
        .requestMatchers(HttpMethod.POST, "/api/v1/trades/**").authenticated()
        .requestMatchers(HttpMethod.GET, "/api/v1/trades/**").authenticated()

        // Everything else requires auth
        .anyRequest().authenticated()
      )
      .headers(headers -> headers
        .contentSecurityPolicy(csp -> csp.policyDirectives(
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
        .frameOptions(frame -> frame.deny())
        .referrerPolicy(referrer -> referrer.policy(
            ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
        .httpStrictTransportSecurity(hsts -> hsts
            .includeSubDomains(true)
            .preload(true)
            .maxAgeInSeconds(31536000)))
          .exceptionHandling(exceptions -> exceptions
            .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
      .formLogin(form -> form.disable())
      .addFilterBefore(new JwtCookieFilter(
          jwtUtil, users, properties.getCookieName()), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  // --- Reads JWT from HTTP-only cookie and authenticates the request ---
  static class JwtCookieFilter extends OncePerRequestFilter {
    private final JwtUtil jwt;
    private final UserRepository users;
    private final String authCookie;

    JwtCookieFilter(JwtUtil jwt, UserRepository users, String authCookie) {
      this.jwt = jwt;
      this.users = users;
      this.authCookie = authCookie;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
        throws ServletException, IOException {

      String token = null;
      Cookie[] cookies = req.getCookies();
      if (cookies != null) {
        for (Cookie c : cookies) {
          if (authCookie.equals(c.getName())) {
            token = c.getValue();
            break;
          }
        }
      }

      if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
        try {
            JwtUtil.JwtClaims claims = jwt.parseAndValidate(token);
            UserDetails user = users.findByIdAndAccountEnabledTrue(claims.userId())
              .filter(candidate -> candidate.getTokenVersion() == claims.tokenVersion())
              .orElseThrow(() -> new UsernameNotFoundException("User not found or token revoked"));
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
