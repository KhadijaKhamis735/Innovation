package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.config.JpaAuditingConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Persistence test for {@link RefreshTokenRepository} using H2 in PostgreSQL
 * mode + {@code create-drop}. Verifies:
 *   - hash-based lookup
 *   - {@code @Column(unique=true)} is enforced at the DB level
 *   - the {@code revokeFamily} and {@code revokeAllForPrincipal} JPQL bulk
 *     updates actually affect the right rows
 *   - {@code Surface} enum round-trips through JPA
 *   - {@code @CreatedDate} is populated by auditing
 *
 * After every {@code @Modifying} bulk update we call {@code flush()} and
 * {@code clear()} so the assertions read the database state, not the
 * first-level cache.
 */
@DataJpaTest
@AutoConfigureTestDatabase
@ActiveProfiles("test")
@Import(JpaAuditingConfig.class)
class RefreshTokenRepositoryTest {

    @Autowired private RefreshTokenRepository repo;
    @Autowired private TestEntityManager em;

    private static RefreshToken rowFor(RefreshToken.Surface surface, long userId, UUID family, String hash) {
        return RefreshToken.builder()
                .surface(surface)
                .userId(userId)
                .familyId(family)
                .tokenHash(hash)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
    }

    @Test
    void findByTokenHash_returnsMatchingRow() {
        UUID family = UUID.randomUUID();
        RefreshToken saved = em.persistAndFlush(rowFor(
                RefreshToken.Surface.INNOVATION, 1L, family, "hash-A"));

        Optional<RefreshToken> found = repo.findByTokenHash("hash-A");

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(saved.getId());
    }

    @Test
    void uniqueConstraintOnTokenHash_isEnforced() {
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, UUID.randomUUID(), "hash-dup"));

        // H2 raises a raw ConstraintViolationException, Postgres wraps it in
        // DataIntegrityViolationException. The Spring DAO translator is
        // enabled in production but the test slice sometimes gets the raw
        // exception; assert on the cause chain.
        assertThatThrownBy(() -> {
            em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 2L, UUID.randomUUID(), "hash-dup"));
            em.flush();
        })
                .isInstanceOfAny(DataIntegrityViolationException.class,
                        org.hibernate.exception.ConstraintViolationException.class);
    }

    @Test
    void revokeFamily_revokesOnlyMatchingFamily_andLeavesOthersActive() {
        UUID familyA = UUID.randomUUID();
        UUID familyB = UUID.randomUUID();
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyA, "A1"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyA, "A2"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyB, "B1"));

        int updated = repo.revokeFamily(familyA, Instant.now());
        em.flush();
        em.clear();

        assertThat(updated).isEqualTo(2);

        // Family A: all revoked.
        List<RefreshToken> aRows = repo.findAllByFamilyId(familyA);
        assertThat(aRows).hasSize(2);
        assertThat(aRows).allMatch(r -> r.getRevokedAt() != null);

        // Family B: untouched.
        List<RefreshToken> bRows = repo.findAllByFamilyId(familyB);
        assertThat(bRows).hasSize(1);
        assertThat(bRows.get(0).getRevokedAt()).isNull();
    }

    @Test
    void revokeAllForPrincipal_revokesOnlyMatchingSurfaceAndUser() {
        // User 1, surface INNOVATION
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, UUID.randomUUID(), "U1I1"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, UUID.randomUUID(), "U1I2"));
        // User 1, surface CLUB (same userId, different surface — should NOT be touched)
        em.persistAndFlush(rowFor(RefreshToken.Surface.CLUB, 1L, UUID.randomUUID(), "U1C1"));
        // User 2, surface INNOVATION (same surface, different userId — should NOT be touched)
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 2L, UUID.randomUUID(), "U2I1"));

        int updated = repo.revokeAllForPrincipal(
                RefreshToken.Surface.INNOVATION, 1L, Instant.now());
        em.flush();
        em.clear();

        assertThat(updated).isEqualTo(2);

        assertThat(repo.findByTokenHash("U1I1").orElseThrow().getRevokedAt()).isNotNull();
        assertThat(repo.findByTokenHash("U1I2").orElseThrow().getRevokedAt()).isNotNull();
        assertThat(repo.findByTokenHash("U1C1").orElseThrow().getRevokedAt()).isNull();
        assertThat(repo.findByTokenHash("U2I1").orElseThrow().getRevokedAt()).isNull();
    }

    /**
     * Phase 2 mobile — multi-device password reset must revoke every
     * refresh-token family for the principal, not just the one that
     * happened to be presented. Each login (or sign-in on a new device)
     * opens a fresh family, so {@code revokeAllForPrincipal} has to
     * ignore {@code familyId} entirely when the (surface, userId) pair
     * matches.
     */
    @Test
    void revokeAllForPrincipal_spansEveryFamily_forSamePrincipal() {
        UUID familyA = UUID.randomUUID();
        UUID familyB = UUID.randomUUID();
        // Two distinct families for user 1, both on INNOVATION.
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyA, "spanA1"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyA, "spanA2"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyB, "spanB1"));
        em.persistAndFlush(rowFor(RefreshToken.Surface.INNOVATION, 1L, familyB, "spanB2"));

        int updated = repo.revokeAllForPrincipal(
                RefreshToken.Surface.INNOVATION, 1L, Instant.now());
        em.flush();
        em.clear();

        assertThat(updated).isEqualTo(4);

        // Every row across both families is revoked.
        assertThat(repo.findByTokenHash("spanA1").orElseThrow().getRevokedAt()).isNotNull();
        assertThat(repo.findByTokenHash("spanA2").orElseThrow().getRevokedAt()).isNotNull();
        assertThat(repo.findByTokenHash("spanB1").orElseThrow().getRevokedAt()).isNotNull();
        assertThat(repo.findByTokenHash("spanB2").orElseThrow().getRevokedAt()).isNotNull();
    }

    @Test
    void surfaceEnum_persistsAndReloadsAsString() {
        UUID family = UUID.randomUUID();
        em.persistAndFlush(rowFor(RefreshToken.Surface.CLUB, 1L, family, "enum-hash"));
        em.clear();

        RefreshToken reloaded = repo.findByTokenHash("enum-hash").orElseThrow();
        assertThat(reloaded.getSurface()).isEqualTo(RefreshToken.Surface.CLUB);
    }

    @Test
    void createdDate_isPopulatedByAuditing() {
        UUID family = UUID.randomUUID();
        RefreshToken saved = em.persistAndFlush(rowFor(
                RefreshToken.Surface.INNOVATION, 1L, family, "audit-hash"));
        em.clear();

        RefreshToken reloaded = repo.findByTokenHash("audit-hash").orElseThrow();
        // The AuditingEntityListener should have filled this in on persist.
        assertThat(reloaded.getCreatedAt()).isNotNull();
        assertThat(reloaded.getCreatedAt()).isCloseTo(saved.getCreatedAt(), within(1_000));
    }

    private static org.assertj.core.data.TemporalUnitOffset within(long millis) {
        return new org.assertj.core.data.TemporalUnitWithinOffset(millis, ChronoUnit.MILLIS);
    }
}
