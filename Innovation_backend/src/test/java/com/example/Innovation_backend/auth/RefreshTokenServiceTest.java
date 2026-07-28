package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.config.RefreshProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link RefreshTokenService}. Pure Mockito — no Spring, no DB.
 *
 * Why these tests matter: the security guarantee of "reuse kills the family"
 * is encoded entirely in {@link RefreshTokenService#rotate(String)}; a unit
 * test with a mock repository catches the contract regression cheaply.
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository repo;
    @Mock private RefreshProperties props;

    @InjectMocks private RefreshTokenService service;

    private static final long SEVEN_DAYS_MS = 7L * 24 * 60 * 60 * 1000;

    @BeforeEach
    void stubProps() throws Exception {
        // RefreshProperties is a record. Mockito can't stub record accessors
        // through @Mock reliably, so we hand-build a real instance with the
        // fields the service actually reads. The compact constructor still
        // applies its defaults, so any 0/-1 values will be normalised.
        RefreshProperties realProps = new RefreshProperties(
                900_000L,         // access-expiration-ms (unused here)
                SEVEN_DAYS_MS,    // refresh-expiration-ms — what issue() reads
                "refresh_token",
                false,
                "/",
                "Lax"
        );
        // Inject via the @Mock field via reflection so @InjectMocks stays happy.
        Field f = RefreshTokenService.class.getDeclaredField("props");
        f.setAccessible(true);
        f.set(service, realProps);
    }

    // ── issue() ─────────────────────────────────────────────────────

    @Test
    void issue_persistsHashedToken_inSameFamily() {
        // The default issue() generates its own familyId; we can only assert
        // the structural shape, not the family value itself.
        when(repo.save(any(RefreshToken.class))).thenAnswer(inv -> {
            RefreshToken in = inv.getArgument(0);
            in.setId(1L);
            return in;
        });

        Instant before = Instant.now();
        RefreshTokenService.Issued issued = service.issue(RefreshToken.Surface.INNOVATION, 42L);
        Instant after = Instant.now();

        assertThat(issued.rawToken()).isNotBlank();
        // The hash stored must NOT equal the raw token (basic sanity).
        assertThat(issued.row().getTokenHash()).isNotEqualTo(issued.rawToken());
        assertThat(issued.row().getTokenHash()).hasSize(64); // SHA-256 hex
        // Expiry is now + 7 days, give or take the test runtime.
        assertThat(issued.row().getExpiresAt())
                .isAfter(before.plus(SEVEN_DAYS_MS - 5_000, ChronoUnit.MILLIS).truncatedTo(ChronoUnit.MILLIS))
                .isBefore(after.plus(SEVEN_DAYS_MS + 5_000, ChronoUnit.MILLIS));
    }

    @Test
    void issue_withExplicitFamilyId_preservesFamilyId() {
        UUID family = UUID.randomUUID();
        when(repo.save(any(RefreshToken.class))).thenAnswer(inv -> {
            RefreshToken in = inv.getArgument(0);
            in.setId(1L);
            return in;
        });

        RefreshTokenService.Issued issued = service.issue(RefreshToken.Surface.CLUB, 7L, family);
        assertThat(issued.row().getFamilyId()).isEqualTo(family);
    }

    // ── rotate() — happy path ───────────────────────────────────────

    @Test
    void rotate_validToken_revokesOldAndIssuesNew_inSameFamily() {
        UUID family = UUID.randomUUID();
        Instant past = Instant.now().minus(1, ChronoUnit.HOURS);
        RefreshToken existing = RefreshToken.builder()
                .id(1L)
                .surface(RefreshToken.Surface.INNOVATION)
                .userId(42L)
                .familyId(family)
                .tokenHash("hash-of-presented-raw")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .createdAt(past)
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(existing));
        when(repo.save(any(RefreshToken.class))).thenAnswer(inv -> {
            RefreshToken in = inv.getArgument(0);
            if (in.getId() == null) in.setId(2L);
            return in;
        });

        RefreshTokenService.Issued next = service.rotate("raw-token-from-cookie");

        // The replacement was issued in the SAME family (rotation, not new session).
        assertThat(next.row().getFamilyId()).isEqualTo(family);
        // And the presented token was marked revoked.
        assertThat(existing.getRevokedAt()).isNotNull();
        assertThat(existing.getReplacedBy()).isSameAs(next.row());
    }

    // ── rotate() — error paths ──────────────────────────────────────

    @Test
    void rotate_unknownToken_throwsInvalidRefreshException() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.rotate("never-issued-raw"))
                .isInstanceOf(RefreshTokenService.InvalidRefreshException.class);

        verify(repo, never()).save(any());
    }

    @Test
    void rotate_expiredToken_throwsInvalidRefreshException_andDoesNotIssue() {
        RefreshToken expired = RefreshToken.builder()
                .id(1L)
                .surface(RefreshToken.Surface.INNOVATION)
                .userId(42L)
                .familyId(UUID.randomUUID())
                .tokenHash("expired-hash")
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.rotate("raw"))
                .isInstanceOf(RefreshTokenService.InvalidRefreshException.class);

        verify(repo, never()).save(any());
        verify(repo, never()).revokeFamily(any(), any());
    }

    @Test
    void rotate_revokedToken_callsRevokeFamilyAndThrowsReuseDetected() {
        UUID family = UUID.randomUUID();
        RefreshToken revoked = RefreshToken.builder()
                .id(1L)
                .surface(RefreshToken.Surface.INNOVATION)
                .userId(42L)
                .familyId(family)
                .tokenHash("revoked-hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .revokedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> service.rotate("raw"))
                .isInstanceOf(RefreshTokenService.ReuseDetectedException.class);

        // The family was killed — and we passed the right familyId, plus a
        // current Instant (not CURRENT_TIMESTAMP, which the JPQL no longer uses).
        ArgumentCaptor<UUID> familyCap = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<Instant> nowCap = ArgumentCaptor.forClass(Instant.class);
        verify(repo, times(1)).revokeFamily(familyCap.capture(), nowCap.capture());
        assertThat(familyCap.getValue()).isEqualTo(family);
        assertThat(nowCap.getValue()).isBeforeOrEqualTo(Instant.now());
    }

    @Test
    void rotate_reuse_doesNotAffectOtherFamilies() {
        // Regression guard for the family-isolation contract. We capture the
        // familyId passed to revokeFamily() and assert it matches the
        // presented token's family, not any other one.
        UUID family = UUID.randomUUID();
        UUID otherFamily = UUID.randomUUID();
        RefreshToken revoked = RefreshToken.builder()
                .id(1L)
                .surface(RefreshToken.Surface.INNOVATION)
                .userId(42L)
                .familyId(family)
                .tokenHash("revoked-hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .revokedAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(revoked));

        try {
            service.rotate("raw");
        } catch (RefreshTokenService.ReuseDetectedException expected) {
            // swallow
        }

        ArgumentCaptor<UUID> familyCap = ArgumentCaptor.forClass(UUID.class);
        verify(repo).revokeFamily(familyCap.capture(), any());
        assertThat(familyCap.getValue())
                .isEqualTo(family)
                .isNotEqualTo(otherFamily);
    }

    // ── revoke() ────────────────────────────────────────────────────

    @Test
    void revoke_marksActiveTokenRevoked() {
        // The service hashes the raw token first, then looks up by hash —
        // we mirror that here so the stub matches the actual lookup.
        String raw = "raw-token";
        String hash = service.sha256Hex(raw);
        RefreshToken active = RefreshToken.builder()
                .id(1L)
                .surface(RefreshToken.Surface.INNOVATION)
                .userId(42L)
                .familyId(UUID.randomUUID())
                .tokenHash(hash)
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(hash)).thenReturn(Optional.of(active));

        service.revoke(raw);

        assertThat(active.getRevokedAt()).isNotNull();
    }

    @Test
    void revoke_unknownToken_isNoop() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        // Must not throw.
        service.revoke("never-issued");

        verify(repo, never()).save(any());
    }
}
