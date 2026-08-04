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
 * The {@code @Value} fields ({@code verificationUrlWeb},
 * {@code verificationUrlApp}, {@code expirationMs}) are wired by Spring at
 * runtime; in unit tests we inject them with {@link ReflectionTestUtils} so
 * {@code @InjectMocks} can construct the service. Phase 2 split the single
 * {@code verificationUrlBase} into the two separate fields and threaded a
 * {@link LinkAudience} through {@code issue} — these tests assert both links
 * appear in the body and that the audience controls their ordering.
 */
@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock private EmailVerificationTokenRepository repo;
    @Mock private EmailService emailService;

    private EmailVerificationService service;

    private static final String URL_WEB = "http://localhost:5173/verify?token=";
    private static final String URL_APP = "innovationmobile://verify?token=";
    private static final long TWENTY_FOUR_HOURS_MS = 24L * 60 * 60 * 1000;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(repo, emailService);
        ReflectionTestUtils.setField(service, "verificationUrlWeb", URL_WEB);
        ReflectionTestUtils.setField(service, "verificationUrlApp", URL_APP);
        ReflectionTestUtils.setField(service, "expirationMs", TWENTY_FOUR_HOURS_MS);
    }

    // ── issue() — Phase 2: both links in the body, audience-aware order

    @Test
    void issue_webAudience_bodyContainsBothLinks_webFirst() {
        when(repo.findAllBySurfaceAndUserId(any(), any())).thenReturn(List.of());
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> {
            EmailVerificationToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(1L);
            return t;
        });

        EmailVerificationService.Issued issued = service.issue(
                EmailVerificationToken.Surface.INNOVATION, 42L, "u@example.com",
                LinkAudience.WEB);

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(anyString(), anyString(), body.capture());
        // Both links are present.
        assertThat(body.getValue()).contains(URL_WEB + issued.rawToken());
        assertThat(body.getValue()).contains(URL_APP + issued.rawToken());
        // Web is primary for the WEB audience, app is the fallback — so
        // the web link appears strictly before the app link in the body.
        int webIdx = body.getValue().indexOf(URL_WEB + issued.rawToken());
        int appIdx = body.getValue().indexOf(URL_APP + issued.rawToken());
        assertThat(webIdx).isPositive();
        assertThat(appIdx).isPositive();
        assertThat(webIdx).isLessThan(appIdx);
    }

    @Test
    void issue_mobileAudience_bodyContainsBothLinks_appFirst() {
        when(repo.findAllBySurfaceAndUserId(any(), any())).thenReturn(List.of());
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> {
            EmailVerificationToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(1L);
            return t;
        });

        EmailVerificationService.Issued issued = service.issue(
                EmailVerificationToken.Surface.INNOVATION, 42L, "u@example.com",
                LinkAudience.MOBILE);

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(anyString(), anyString(), body.capture());
        assertThat(body.getValue()).contains(URL_WEB + issued.rawToken());
        assertThat(body.getValue()).contains(URL_APP + issued.rawToken());
        // App is primary for the MOBILE audience — must appear first.
        int webIdx = body.getValue().indexOf(URL_WEB + issued.rawToken());
        int appIdx = body.getValue().indexOf(URL_APP + issued.rawToken());
        assertThat(webIdx).isPositive();
        assertThat(appIdx).isPositive();
        assertThat(appIdx).isLessThan(webIdx);
    }

    @Test
    void issue_invalidatesPriorTokensAndSetsId() {
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

        // Expiry is 24h from now (give or take runtime).
        assertThat(issued.row().getExpiresAt())
                .isAfter(Instant.now().plus(TWENTY_FOUR_HOURS_MS - 5_000, ChronoUnit.MILLIS))
                .isBefore(Instant.now().plus(TWENTY_FOUR_HOURS_MS + 5_000, ChronoUnit.MILLIS));
    }

    @Test
    void issue_defaultAudience_isWeb() {
        // The no-audience overload must default to WEB so existing callers
        // (register + resendVerification on the web surface) get the same
        // primary-then-fallback layout they always did.
        when(repo.findAllBySurfaceAndUserId(any(), any())).thenReturn(List.of());
        when(repo.save(any(EmailVerificationToken.class))).thenAnswer(inv -> {
            EmailVerificationToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(1L);
            return t;
        });

        EmailVerificationService.Issued issued = service.issue(
                EmailVerificationToken.Surface.INNOVATION, 1L, "u@example.com");

        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(anyString(), anyString(), body.capture());
        int webIdx = body.getValue().indexOf(URL_WEB + issued.rawToken());
        int appIdx = body.getValue().indexOf(URL_APP + issued.rawToken());
        assertThat(webIdx).isLessThan(appIdx);
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
