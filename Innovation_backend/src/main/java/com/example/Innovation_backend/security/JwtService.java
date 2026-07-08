package com.example.Innovation_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * Issues and validates JWT tokens. Tokens are signed with HS512 using
 * the secret in application.properties (app.jwt.secret).
 *
 * Token claims:
 *   sub  — email (login id)
 *   uid  — user id (Long)
 *   role — single role string ("innovator" | "funder" | "admin" | "club-member" | "club-leader")
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        // Secret must be at least 64 bytes for HS512
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 64) {
            throw new IllegalArgumentException(
                    "app.jwt.secret must be at least 64 bytes for HS512. Current length: " + bytes.length);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
    }

    /**
     * Issue a token for a given principal.
     * @param email the user's login id (used as "sub")
     * @param userId the user's id
     * @param role lowercase role string ("innovator", "funder", etc.)
     */
    public String issue(String email, Long userId, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claims(Map.of("uid", userId, "role", role))
                .issuedAt(now)
                .expiration(exp)
                .signWith(key, Jwts.SIG.HS512)
                .compact();
    }

    /** Parse a token and return its claims. Throws on invalid/expired. */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Convenience: returns the email (sub) from a token or null if invalid. */
    public String extractEmail(String token) {
        try {
            return parse(token).getSubject();
        } catch (Exception e) {
            return null;
        }
    }
}
