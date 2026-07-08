package com.example.Innovation_backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Once per request, this filter checks for an `Authorization: Bearer <jwt>` header,
 * validates the token, and sets the SecurityContext so downstream code can call
 * {@code @PreAuthorize("hasRole('ADMIN')")} etc.
 *
 * If no header is present OR the token is invalid, the filter simply lets the
 * request through — Spring Security's authorization rules in SecurityConfig will
 * then decide to return 401.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader(HEADER);

        if (header == null || !header.startsWith(PREFIX)) {
            // No token — let SecurityConfig decide
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(PREFIX.length()).trim();

        try {
            Claims claims = jwtService.parse(token);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            if (email != null && role != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Spring role convention: prefix with "ROLE_"
                var authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

                var auth = new UsernamePasswordAuthenticationToken(
                        email,                  // principal (we'll use email until Phase 2 loads the User)
                        null,
                        List.of(authority)
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ex) {
            // Invalid/expired token — clear context and let downstream return 401
            log.debug("Rejected JWT: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
