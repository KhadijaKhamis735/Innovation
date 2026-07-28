package com.example.Innovation_backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findAllByFamilyId(UUID familyId);

    /**
     * Revoke every still-active token in a family. Used when reuse of a
     * revoked token is detected (the entire chain is untrusted).
     *
     * Takes {@code revokedAt} as a parameter rather than using
     * {@code CURRENT_TIMESTAMP} so the query stays portable across databases
     * (H2 resolves {@code CURRENT_TIMESTAMP} to {@code java.sql.Timestamp},
     * which can't be assigned to our {@code Instant} field — HHH-17560).
     */
    @Modifying
    @Query("""
           update RefreshToken r
              set r.revokedAt = :revokedAt
            where r.familyId = :familyId
              and r.revokedAt is null
           """)
    int revokeFamily(@Param("familyId") UUID familyId,
                     @Param("revokedAt") Instant revokedAt);

    /**
     * Phase 6C — revoke every active refresh token for a given principal.
     * Called after a password reset so any session established with the
     * (presumed leaked) old password is killed. See {@link #revokeFamily}
     * for why we take the timestamp as a parameter.
     */
    @Modifying
    @Query("""
           update RefreshToken r
              set r.revokedAt = :revokedAt
            where r.surface = :surface
              and r.userId = :userId
              and r.revokedAt is null
           """)
    int revokeAllForPrincipal(@Param("surface") RefreshToken.Surface surface,
                             @Param("userId") Long userId,
                             @Param("revokedAt") Instant revokedAt);
}

