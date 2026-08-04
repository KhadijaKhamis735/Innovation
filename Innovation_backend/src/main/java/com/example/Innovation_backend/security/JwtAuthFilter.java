package com.example.Innovation_backend.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Once per request, this filter checks for an `Authorization: Bearer <jwt>` header,
 * validates the token, and sets the SecurityContext so downstream code can call
 * {@code @PreAuthorize("hasRole('ADMIN')")} / {@code @AuthenticationPrincipal UserDetails}
 * etc.
 *
 * If no header is present OR the token is invalid, the filter simply lets the
 * request through — Spring Security's authorization rules in SecurityConfig will
 * then decide to return 401.
 *
 * The principal put into the SecurityContext is the real {@link UserDetails} loaded
 * from {@link UserDetailsService} (i.e. {@code UserDetailsServiceImpl}). Storing the
 * email String would make every {@code @AuthenticationPrincipal UserDetails} binding
 * resolve to {@code null}, which previously NPE'd in /api/auth/me and
 * /api/mobile/auth/me.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

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

            if (email != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                // Load the real UserDetails so @AuthenticationPrincipal UserDetails
                // bindings resolve correctly. The role / authority comes from the
                // DB-backed UserDetails, not the JWT claim, so a revoked user
                // (status != 'active') loses access even if their token is still
                // cryptographically valid.
                UserDetails userDetails;
                try {
                    userDetails = userDetailsService.loadUserByUsername(email);
                } catch (UsernameNotFoundException ex) {
                    // Token was valid for a user that no longer exists.
                    log.debug("JWT refers to unknown user: {}", email);
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                if (!userDetails.isEnabled()) {
                    log.debug("JWT user is disabled: {}", email);
                    SecurityContextHolder.clearContext();
                    chain.doFilter(request, response);
                    return;
                }

                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ex) {
            // Invalid/expired/signed-with-wrong-key token — clear context and let
            // downstream return 401.
            log.debug("Rejected JWT: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        chain.doFilter(request, response);
    }
}
