package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.common.EmailService;
import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubLeaderRepository;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubMemberRepository;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Phase 6C — password reset.
 *
 * Two flows:
 *   - {@link #issue} — caller (forgot-password endpoint) calls with an email.
 *     We look up the principal; if it exists, we invalidate prior tokens and
 *     issue a fresh one. We do NOT throw if the email is unknown — the
 *     endpoint always returns success to avoid email enumeration.
 *
 *   - {@link #consume} — caller (reset-password endpoint) passes the raw token
 *     and the new password. We hash the token, look it up, validate, set the
 *     new password, invalidate ALL refresh tokens for that principal, and
 *     mark the reset token consumed.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final SecureRandom RNG = new SecureRandom();

    private final PasswordResetTokenRepository repo;
    private final UserRepository userRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubLeaderRepository clubLeaderRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.email.reset-url}")
    private String resetUrlBase;

    @Value("${app.email.reset-expiration-ms:3600000}") // default 1h
    private long expirationMs;

    /** Result of {@link #issue}. Holds the raw token exactly once. */
    public record Issued(PasswordResetToken row, String rawToken) {}

    /**
     * Look up the email and, if a principal exists, issue a reset token. Returns
     * empty when the email is unknown so the controller can always 200.
     */
    @Transactional
    public Optional<Issued> issueForEmail(String email) {
        String normalised = email == null ? "" : email.trim().toLowerCase();
        if (normalised.isBlank()) return Optional.empty();

        // Try the User table first (innovation), then club member, then leader.
        User user = userRepository.findByEmail(normalised).orElse(null);
        if (user != null) {
            return Optional.of(issueForPrincipal(
                    PasswordResetToken.Surface.INNOVATION,
                    user.getId(),
                    user.getEmail()
            ));
        }
        ClubMember member = clubMemberRepository.findByEmail(normalised).orElse(null);
        if (member != null) {
            return Optional.of(issueForPrincipal(
                    PasswordResetToken.Surface.CLUB,
                    member.getId(),
                    member.getEmail()
            ));
        }
        ClubLeader leader = clubLeaderRepository.findByEmail(normalised).orElse(null);
        if (leader != null) {
            return Optional.of(issueForPrincipal(
                    PasswordResetToken.Surface.CLUB,
                    leader.getId(),
                    leader.getEmail()
            ));
        }
        // Unknown email — return empty so the endpoint can always 200.
        return Optional.empty();
    }

    private Issued issueForPrincipal(PasswordResetToken.Surface surface,
                                     Long userId,
                                     String toEmail) {
        // Invalidate any earlier outstanding tokens for this principal.
        for (PasswordResetToken old : repo.findAllBySurfaceAndUserId(surface, userId)) {
            if (old.getConsumedAt() == null) {
                old.setConsumedAt(Instant.now());
                repo.save(old);
            }
        }

        String raw = randomToken();
        String hash = sha256Hex(raw);
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expirationMs);

        PasswordResetToken row = PasswordResetToken.builder()
                .surface(surface)
                .userId(userId)
                .tokenHash(hash)
                .expiresAt(exp)
                .build();
        row = repo.save(row);

        String link = resetUrlBase + raw;
        String subject = "Reset your Innovation account password";
        String body = """
                Hello,

                We received a request to reset the password on your Innovation account.
                If you made this request, click the link below to set a new password:

                %s

                This link expires in 1 hour. If you didn't make this request, you can
                safely ignore this email — your password will remain unchanged.

                — Innovation Team
                """.formatted(link);

        emailService.send(toEmail, subject, body);
        log.info("Issued password reset token id={} surface={} userId={}",
                row.getId(), surface, userId);
        return new Issued(row, raw);
    }

    /**
     * Consume the token and update the password. Returns the affected principal
     * id + surface on success so the caller can decide whether to log it.
     *
     * @throws InvalidResetTokenException if the token is unknown / expired / used
     */
    @Transactional
    public ConsumeResult consume(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new InvalidResetTokenException("Token is missing");
        }
        if (newPassword == null || newPassword.length() < 6 || !newPassword.matches(".*\\d.*")) {
            // Match RegisterPage.jsx rule: ≥6 chars, contains a digit.
            throw new IllegalArgumentException("Password must be at least 6 characters and contain a digit");
        }
        String hash = sha256Hex(rawToken.trim());
        PasswordResetToken row = repo.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidResetTokenException("Token not recognised"));
        if (row.isConsumed()) {
            throw new InvalidResetTokenException("Token already used");
        }
        if (row.isExpired(Instant.now())) {
            throw new InvalidResetTokenException("Token expired");
        }
        row.setConsumedAt(Instant.now());
        repo.save(row);

        String hashed = passwordEncoder.encode(newPassword);

        if (row.getSurface() == PasswordResetToken.Surface.INNOVATION) {
            User u = userRepository.findById(row.getUserId())
                    .orElseThrow(() -> new IllegalStateException(
                            "User vanished during reset: id=" + row.getUserId()));
            u.setPassword(hashed);
            userRepository.save(u);
        } else {
            ClubMember m = clubMemberRepository.findById(row.getUserId()).orElse(null);
            if (m != null) {
                m.setPassword(hashed);
                clubMemberRepository.save(m);
            } else {
                ClubLeader l = clubLeaderRepository.findById(row.getUserId())
                        .orElseThrow(() -> new IllegalStateException(
                                "ClubLeader vanished during reset: id=" + row.getUserId()));
                l.setPassword(hashed);
                clubLeaderRepository.save(l);
            }
        }

        // Invalidate ALL refresh tokens for this principal — assume the leaked
        // password is now burned and any session established with it must die.
        // The two enums (PasswordResetToken.Surface / RefreshToken.Surface) have
        // the same values (INNOVATION, CLUB); map by name.
        refreshTokenRepository.revokeAllForPrincipal(
                RefreshToken.Surface.valueOf(row.getSurface().name()),
                row.getUserId(),
                Instant.now());

        log.info("Consumed password reset token id={} surface={} userId={}",
                row.getId(), row.getSurface(), row.getUserId());
        return new ConsumeResult(row.getSurface(), row.getUserId());
    }

    public record ConsumeResult(PasswordResetToken.Surface surface, Long userId) {}

    /** Thrown when a presented reset token can't be honoured. */
    public static class InvalidResetTokenException extends RuntimeException {
        public InvalidResetTokenException(String msg) { super(msg); }
    }

    // ── Internals ─────────────────────────────────────────────────────

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
}
