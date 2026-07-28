package com.example.Innovation_backend.auth;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Persisted email verification token. Same hashed-storage pattern as
 * {@link RefreshToken}: the raw token is returned to the caller exactly once
 * and only the SHA-256 hex digest is persisted.
 *
 * Lives in the {@code email_verification_tokens} table — see V4 migration.
 */
@Entity
@Table(name = "email_verification_tokens")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EmailVerificationToken {

    public enum Surface { INNOVATION, CLUB }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Surface surface;

    /** id of the principal (User | ClubMember). */
    @Column(nullable = false)
    private Long userId;

    /** SHA-256 hex digest of the raw token. */
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
