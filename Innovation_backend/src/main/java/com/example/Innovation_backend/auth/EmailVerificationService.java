package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.common.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and consumes email verification tokens.
 *
 * Token format: 32 random bytes → URL-safe Base64 (no padding), same shape as
 * refresh tokens. Stored as SHA-256 hex digest.
 *
 * Each successful call to {@link #issue} for a given principal invalidates any
 * older tokens for that principal — single active token at a time.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private static final SecureRandom RNG = new SecureRandom();

    private final EmailVerificationTokenRepository repo;
    private final EmailService emailService;

    @Value("${app.email.verification-url}")
    private String verificationUrlBase;

    @Value("${app.email.verification-expiration-ms:86400000}")
    private long expirationMs;

    /** Result of {@link #issue}. Holds the raw token exactly once. */
    public record Issued(EmailVerificationToken row, String rawToken) {}

    @Transactional
    public Issued issue(EmailVerificationToken.Surface surface, Long userId, String toEmail) {
        // Invalidate any earlier tokens for this principal.
        for (EmailVerificationToken old : repo.findAllBySurfaceAndUserId(surface, userId)) {
            if (old.getConsumedAt() == null) {
                old.setConsumedAt(Instant.now()); // mark consumed so it can't be used
                repo.save(old);
            }
        }

        String raw = randomToken();
        String hash = sha256Hex(raw);
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expirationMs);

        EmailVerificationToken row = EmailVerificationToken.builder()
                .surface(surface)
                .userId(userId)
                .tokenHash(hash)
                .expiresAt(exp)
                .build();
        row = repo.save(row);

        String link = verificationUrlBase + raw;
        String subject = "Verify your Innovation account";
        String body = """
                Hello,

                Thanks for registering with the Innovation platform.
                Please verify your email by clicking the link below:

                %s

                This link expires in 24 hours. If you didn't create this account,
                you can safely ignore this email.

                — Innovation Team
                """.formatted(link);

        emailService.send(toEmail, subject, body);
        log.info("Issued email verification token id={} surface={} userId={}",
                row.getId(), surface, userId);
        return new Issued(row, raw);
    }

    /**
     * Consume the token if it's still valid. Returns the matched row on
     * success. Throws otherwise — caller decides the HTTP mapping.
     */
    @Transactional
    public EmailVerificationToken consume(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidVerificationTokenException("Token is missing");
        }
        String hash = sha256Hex(rawToken.trim());
        EmailVerificationToken row = repo.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidVerificationTokenException("Token not recognised"));

        if (row.isConsumed()) {
            throw new InvalidVerificationTokenException("Token already used");
        }
        if (row.isExpired(Instant.now())) {
            throw new InvalidVerificationTokenException("Token expired");
        }
        row.setConsumedAt(Instant.now());
        return repo.save(row);
    }

    /** Convenience: same as {@link #consume} but returns Optional for nullable callers. */
    public Optional<EmailVerificationToken> tryConsume(String rawToken) {
        try {
            return Optional.of(consume(rawToken));
        } catch (InvalidVerificationTokenException e) {
            return Optional.empty();
        }
    }

    /** SHA-256 hex digest. Same helper used by {@link RefreshTokenService}. */
    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private String randomToken() {
        byte[] buf = new byte[32];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    /** Thrown when a presented verification token can't be honoured. */
    public static class InvalidVerificationTokenException extends RuntimeException {
        public InvalidVerificationTokenException(String msg) { super(msg); }
    }
}
