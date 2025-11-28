package com.betting.backend.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allowed origins (frontends)
        config.setAllowedOrigins(List.of(
                "https://www.pryzm.ca",
                "https://pryzm.ca",
                "http://localhost:5173" // keep for local dev if needed
        ));

        // HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Headers the client can send
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));

        // If you use cookies / Authorization header
        config.setAllowCredentials(true);

        // How long the preflight can be cached by browsers (optional)
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
}
