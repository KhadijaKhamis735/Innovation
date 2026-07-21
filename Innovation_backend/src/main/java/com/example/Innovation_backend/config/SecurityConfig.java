package com.example.Innovation_backend.config;

import com.example.Innovation_backend.security.JwtAuthFilter;
import com.example.Innovation_backend.security.RestAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Master security configuration. Defines which routes are public, how authentication
 * works (JWT bearer tokens), CORS, password hashing, and what gets returned on auth failures.
 */
@Configuration
@EnableMethodSecurity          // enables @PreAuthorize on controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RestAuthenticationEntryPoint authEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — we use stateless JWT, not browser cookies
                .csrf(csrf -> csrf.disable())

                // CORS (configured in corsConfigurationSource() below)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless — no HttpSession, no JSESSIONID cookie
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Custom entry point returns JSON 401 instead of an HTML page
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authEntryPoint))

                // ── URL-level access rules ────────────────────────────────
                .authorizeHttpRequests(auth -> auth
                        // Public: health + auth endpoints (Phase 2) + read-only public listings
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/club/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/opportunities").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/opportunities/*").permitAll()
                        // Club branch list + detail + branch project feed are now
                        // authenticated; the controllers carry @PreAuthorize, and the
                        // services scope results by the caller's university.
                        // (Earlier this block permitted GETs publicly; that was a
                        // privacy leak — Phase 5A follow-up.)

                        // Static assets and error endpoints (Spring Boot default)
                        .requestMatchers("/error").permitAll()

                        // Everything else requires a valid JWT
                        .anyRequest().authenticated()
                )

                // Run our JWT filter before Spring's username/password filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        // React (Vite default 5173) + CRA (3000) — extend as needed
        cfg.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173"
        ));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
