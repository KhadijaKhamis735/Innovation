package com.example.Innovation_backend.auth;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Persisted refresh token. We store the SHA-256 hash of the raw token, never
 * the raw token itself — if the DB leaks, the tokens are not directly usable.
 *
 * Rotation: when a refresh is exchanged for a fresh access token, the old
 * row is marked {@code revokedAt} and {@code replacedBy} points to the new
 * row. A {@code familyId} ties every token in a single login chain together
 * so we can detect reuse of a revoked token and kill the whole family.
 */
@Entity
@Table(name = "refresh_tokens")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

    public enum Surface { INNOVATION, CLUB }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Surface surface;

    /** id of the principal (User | ClubMember | ClubLeader). */
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private UUID familyId;

    /** SHA-256 hex digest of the raw token. */
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_id")
    private RefreshToken replacedBy;

    public boolean isActive(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }
}
