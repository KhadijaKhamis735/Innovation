package com.example.Innovation_backend.auth;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Persisted password-reset token. Same hashed-storage pattern as
 * {@link RefreshToken} and {@link EmailVerificationToken}: the raw token is
 * returned to the caller exactly once and only the SHA-256 hex digest is
 * persisted.
 */
@Entity
@Table(name = "password_reset_tokens")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasswordResetToken {

    public enum Surface { INNOVATION, CLUB }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Surface surface;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant consumedAt;

    public boolean isConsumed() { return consumedAt != null; }
    public boolean isExpired(Instant now) { return !expiresAt.isAfter(now); }
}
