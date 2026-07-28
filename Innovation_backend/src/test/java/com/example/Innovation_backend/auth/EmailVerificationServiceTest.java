package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.common.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link EmailVerificationService}. Pure Mockito — no Spring, no DB.
 *
 * The two {@code @Value} fields ({@code verificationUrlBase},
 * {@code expirationMs}) are wired by Spring at runtime; in unit tests we
 * inject them with {@link ReflectionTestUtils} so {@code @InjectMocks} can
 * construct the service.
 */
@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock private EmailVerificationTokenRepository repo;
    @Mock private EmailService emailService;

    private EmailVerificationService service;

    private static final String URL_BASE = "http://localhost:5173/verify?token=";
    private static final long TWENTY_FOUR_HOURS_MS = 24L * 60 * 60 * 1000;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(repo, emailService);
        ReflectionTestUtils.setField(service, "verificationUrlBase", URL_BASE);
        ReflectionTestUtils.setField(service, "expirationMs", TWENTY_FOUR_HOURS_MS);
    }

    // ── issue() ─────────────────────────────────────────────────────

    @Test
    void issue_invalidatesPriorTokensAndSendsEmailWithCorrectLink() {
        EmailVerificationToken old = EmailVerificationToken.builder()
                .surface(EmailVerificationToken.Surface.INNOVATION)
                .userId(42L)
                .tokenHash("old-hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findAllBySurfaceAndUserId(EmailVerificationToken.Surface.INNOVATION, 42L))
                .thenReturn(List.of(old));
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> {
            EmailVerificationToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(1L);
            return t;
        });

        EmailVerificationService.Issued issued = service.issue(
                EmailVerificationToken.Surface.INNOVATION, 42L, "u@example.com");

        // Prior token is invalidated (consumedAt set, saved).
        assertThat(old.getConsumedAt()).isNotNull();
        verify(repo).save(old);

        // Email went out with the link containing the raw token.
        ArgumentCaptor<String> to = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subject = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(to.capture(), subject.capture(), body.capture());
        assertThat(to.getValue()).isEqualTo("u@example.com");
        assertThat(body.getValue()).contains(URL_BASE + issued.rawToken());

        // Expiry is 24h from now (give or take runtime).
        assertThat(issued.row().getExpiresAt())
                .isAfter(Instant.now().plus(TWENTY_FOUR_HOURS_MS - 5_000, ChronoUnit.MILLIS))
                .isBefore(Instant.now().plus(TWENTY_FOUR_HOURS_MS + 5_000, ChronoUnit.MILLIS));
    }

    @Test
    void issue_persistedHashDoesNotEqualRawToken() {
        when(repo.findAllBySurfaceAndUserId(any(), any())).thenReturn(List.of());
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> inv.getArgument(0));

        EmailVerificationService.Issued issued = service.issue(
                EmailVerificationToken.Surface.INNOVATION, 1L, "u@example.com");

        assertThat(issued.row().getTokenHash())
                .isNotEqualTo(issued.rawToken())
                .hasSize(64); // SHA-256 hex digest
    }

    // ── consume() ───────────────────────────────────────────────────

    @Test
    void consume_validToken_marksConsumed() {
        Instant now = Instant.now();
        EmailVerificationToken valid = EmailVerificationToken.builder()
                .id(1L)
                .surface(EmailVerificationToken.Surface.INNOVATION)
                .userId(42L)
                .tokenHash("valid-hash")
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(valid));
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> inv.getArgument(0));

        EmailVerificationToken returned = service.consume("raw-token");

        assertThat(returned.getConsumedAt()).isNotNull();
        verify(repo).save(valid);
    }

    @Test
    void consume_unknownToken_throwsInvalidVerificationTokenException() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consume("never-issued"))
                .isInstanceOf(EmailVerificationService.InvalidVerificationTokenException.class);

        verify(repo, never()).save(any());
    }

    @Test
    void consume_alreadyConsumedToken_throws() {
        EmailVerificationToken consumed = EmailVerificationToken.builder()
                .id(1L)
                .surface(EmailVerificationToken.Surface.INNOVATION)
                .userId(42L)
                .tokenHash("consumed-hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .consumedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(consumed));

        assertThatThrownBy(() -> service.consume("raw"))
                .isInstanceOf(EmailVerificationService.InvalidVerificationTokenException.class)
                .hasMessageContaining("used");
    }

    @Test
    void consume_expiredToken_throws() {
        EmailVerificationToken expired = EmailVerificationToken.builder()
                .id(1L)
                .surface(EmailVerificationToken.Surface.INNOVATION)
                .userId(42L)
                .tokenHash("expired-hash")
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.consume("raw"))
                .isInstanceOf(EmailVerificationService.InvalidVerificationTokenException.class)
                .hasMessageContaining("expired");
    }

    // ── tryConsume() — non-throwing convenience ─────────────────────

    @Test
    void tryConsume_invalidToken_returnsEmpty() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThat(service.tryConsume("never-issued")).isEmpty();
        verify(repo, never()).save(any());
    }

    @Test
    void tryConsume_validToken_consumesAndReturnsRow() {
        EmailVerificationToken valid = EmailVerificationToken.builder()
                .id(1L)
                .surface(EmailVerificationToken.Surface.INNOVATION)
                .userId(42L)
                .tokenHash("valid-hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(valid));
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<EmailVerificationToken> result = service.tryConsume("raw");

        assertThat(result).isPresent();
        assertThat(result.get().getConsumedAt()).isNotNull();
    }
}
