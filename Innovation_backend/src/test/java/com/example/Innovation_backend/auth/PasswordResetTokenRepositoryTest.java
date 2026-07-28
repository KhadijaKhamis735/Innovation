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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Persistence test for {@link PasswordResetTokenRepository}. Same shape as
 * {@link EmailVerificationTokenRepositoryTest}.
 */
@DataJpaTest
@AutoConfigureTestDatabase
@ActiveProfiles("test")
@Import(JpaAuditingConfig.class)
class PasswordResetTokenRepositoryTest {

    @Autowired private PasswordResetTokenRepository repo;
    @Autowired private TestEntityManager em;

    private static PasswordResetToken rowFor(PasswordResetToken.Surface surface,
                                              long userId,
                                              String hash,
                                              Instant expiresAt) {
        return PasswordResetToken.builder()
                .surface(surface)
                .userId(userId)
                .tokenHash(hash)
                .expiresAt(expiresAt)
                .build();
    }

    @Test
    void findByTokenHash_returnsMatchingRow() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 1L,
                "hash-A", Instant.now().plus(1, ChronoUnit.HOURS)));

        Optional<PasswordResetToken> found = repo.findByTokenHash("hash-A");

        assertThat(found).isPresent();
    }

    @Test
    void uniqueConstraintOnTokenHash_isEnforced() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 1L,
                "hash-dup", Instant.now().plus(1, ChronoUnit.HOURS)));

        assertThatThrownBy(() -> {
            em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 2L,
                    "hash-dup", Instant.now().plus(1, ChronoUnit.HOURS)));
            em.flush();
        })
                .isInstanceOfAny(DataIntegrityViolationException.class,
                        org.hibernate.exception.ConstraintViolationException.class);
    }

    @Test
    void consumedAt_persistsAcrossReload() {
        PasswordResetToken t = em.persistAndFlush(rowFor(
                PasswordResetToken.Surface.INNOVATION, 1L, "hash-consumed",
                Instant.now().plus(1, ChronoUnit.HOURS)));
        t.setConsumedAt(Instant.now());
        em.persistAndFlush(t);
        em.clear();

        PasswordResetToken reloaded = repo.findByTokenHash("hash-consumed").orElseThrow();
        assertThat(reloaded.isConsumed()).isTrue();
        assertThat(reloaded.getConsumedAt()).isNotNull();
    }

    @Test
    void isExpired_returnsTrueForPastExpiry() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 1L,
                "hash-expired", Instant.now().minus(1, ChronoUnit.HOURS)));
        em.clear();

        PasswordResetToken reloaded = repo.findByTokenHash("hash-expired").orElseThrow();
        assertThat(reloaded.isExpired(Instant.now())).isTrue();
    }

    @Test
    void isExpired_returnsFalseForFutureExpiry() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 1L,
                "hash-future", Instant.now().plus(1, ChronoUnit.HOURS)));
        em.clear();

        PasswordResetToken reloaded = repo.findByTokenHash("hash-future").orElseThrow();
        assertThat(reloaded.isExpired(Instant.now())).isFalse();
    }

    @Test
    void surfaceEnum_roundTrips() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.CLUB, 1L, "hash-surface",
                Instant.now().plus(1, ChronoUnit.HOURS)));
        em.clear();

        PasswordResetToken reloaded = repo.findByTokenHash("hash-surface").orElseThrow();
        assertThat(reloaded.getSurface()).isEqualTo(PasswordResetToken.Surface.CLUB);
    }

    @Test
    void createdDate_isPopulatedByAuditing() {
        em.persistAndFlush(rowFor(PasswordResetToken.Surface.INNOVATION, 1L,
                "hash-audit", Instant.now().plus(1, ChronoUnit.HOURS)));
        em.clear();

        PasswordResetToken reloaded = repo.findByTokenHash("hash-audit").orElseThrow();
        assertThat(reloaded.getCreatedAt()).isNotNull();
    }
}
