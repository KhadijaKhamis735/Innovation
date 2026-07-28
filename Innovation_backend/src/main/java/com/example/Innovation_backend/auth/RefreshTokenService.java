package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.config.RefreshProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
 * Issues, rotates, and revokes refresh tokens.
 *
 * Token format: 32 random bytes → URL-safe Base64 (no padding). Stored as
 * the SHA-256 hex digest of that string. The raw token is returned to the
 * caller exactly once and never persisted.
 *
 * Rotation rules:
 *   - {@link #issue} creates a new family and returns the raw token.
 *   - {@link #rotate} consumes the presented token and issues a fresh one
 *     in the same family. If the presented token is already revoked (reuse),
 *     the entire family is revoked — the holder is presumed compromised.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private static final SecureRandom RNG = new SecureRandom();

    private final RefreshTokenRepository repo;
    private final RefreshProperties props;

    /** Result of {@link #issue} and {@link #rotate}. Holds the raw token exactly once. */
    public record Issued(RefreshToken row, String rawToken) {}

    @Transactional
    public Issued issue(RefreshToken.Surface surface, Long userId) {
        return issue(surface, userId, UUID.randomUUID());
    }

    @Transactional
    public Issued issue(RefreshToken.Surface surface, Long userId, UUID familyId) {
        String raw = randomToken();
        String hash = sha256Hex(raw);
        Instant now = Instant.now();
        Instant exp = now.plusMillis(props.expirationMs());

        RefreshToken row = RefreshToken.builder()
                .surface(surface)
                .userId(userId)
                .familyId(familyId)
                .tokenHash(hash)
                .expiresAt(exp)
                .build();
        row = repo.save(row);
        log.debug("Issued refresh token id={} surface={} userId={} family={}",
                row.getId(), surface, userId, familyId);
        return new Issued(row, raw);
    }

    /**
     * Consume the presented token and issue a fresh one in the same family.
     *
     * @return the freshly-issued token if everything checks out
     * @throws ReuseDetectedException if the presented token has already been
     *         revoked — the family is killed in that case
     * @throws InvalidRefreshException if the token is unknown, expired, or
     *         otherwise unusable
     */
    @Transactional
    public Issued rotate(String rawToken) {
        String hash = sha256Hex(rawToken);
        RefreshToken existing = repo.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidRefreshException("Refresh token not recognised"));

        Instant now = Instant.now();

        if (existing.getRevokedAt() != null) {
            // Reuse! Kill the whole family.
            log.warn("Refresh token reuse detected for family {} — revoking all tokens in family",
                    existing.getFamilyId());
            repo.revokeFamily(existing.getFamilyId(), Instant.now());
            throw new ReuseDetectedException(
                    "Refresh token reuse detected; all sessions for this user have been revoked");
        }

        if (!existing.getExpiresAt().isAfter(now)) {
            throw new InvalidRefreshException("Refresh token expired");
        }

        // Issue the replacement first so we can point replacedBy at it.
        Issued next = issue(existing.getSurface(), existing.getUserId(), existing.getFamilyId());
        existing.setRevokedAt(now);
        existing.setReplacedBy(next.row());
        repo.save(existing);
        return next;
    }

    /** Revoke a single token (e.g. on logout). */
    @Transactional
    public void revoke(String rawToken) {
        Optional.ofNullable(rawToken)
                .map(this::sha256Hex)
                .flatMap(repo::findByTokenHash)
                .ifPresent(row -> {
                    if (row.getRevokedAt() == null) {
                        row.setRevokedAt(Instant.now());
                        repo.save(row);
                    }
                });
    }

    /** SHA-256 hex digest of {@code input}. */
    String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private String randomToken() {
        byte[] buf = new byte[32];
        RNG.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }

    /** Thrown when a presented refresh token can't be honoured. */
    public static class InvalidRefreshException extends RuntimeException {
        public InvalidRefreshException(String msg) { super(msg); }
    }

    /** Thrown when a revoked refresh token is presented (reuse). */
    public static class ReuseDetectedException extends RuntimeException {
        public ReuseDetectedException(String msg) { super(msg); }
    }
}
