package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubLeaderRepository;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubMemberRepository;
import com.example.Innovation_backend.common.EmailService;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link PasswordResetService}. Pure Mockito — no Spring, no DB.
 *
 * The two {@code @Value} fields ({@code resetUrlBase},
 * {@code expirationMs}) are wired by Spring at runtime; we inject them with
 * {@link ReflectionTestUtils} so {@code @InjectMocks} can construct the service.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock private PasswordResetTokenRepository repo;
    @Mock private UserRepository userRepository;
    @Mock private ClubMemberRepository clubMemberRepository;
    @Mock private ClubLeaderRepository clubLeaderRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;

    private PasswordResetService service;

    private static final String RESET_URL = "http://localhost:5173/reset-password?token=";
    private static final long ONE_HOUR_MS = 60L * 60 * 1000;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(
                repo, userRepository, clubMemberRepository, clubLeaderRepository,
                refreshTokenRepository, emailService, passwordEncoder);
        ReflectionTestUtils.setField(service, "resetUrlBase", RESET_URL);
        ReflectionTestUtils.setField(service, "expirationMs", ONE_HOUR_MS);
    }

    // ── issueForEmail() — cross-table lookup ────────────────────────

    @Test
    void issueForEmail_findsUserInUserTable_sendsResetEmail() {
        User u = User.builder().id(1L).email("u@example.com").password("old").build();
        when(userRepository.findByEmail("u@example.com")).thenReturn(Optional.of(u));
        when(repo.findAllBySurfaceAndUserId(PasswordResetToken.Surface.INNOVATION, 1L))
                .thenReturn(List.of());
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> {
            PasswordResetToken t = inv.getArgument(0);
            if (t.getId() == null) t.setId(10L);
            return t;
        });

        Optional<PasswordResetService.Issued> result = service.issueForEmail("u@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().row().getSurface()).isEqualTo(PasswordResetToken.Surface.INNOVATION);
        assertThat(result.get().row().getUserId()).isEqualTo(1L);

        ArgumentCaptor<String> to = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> body = ArgumentCaptor.forClass(String.class);
        verify(emailService).send(to.capture(), anyString(), body.capture());
        assertThat(to.getValue()).isEqualTo("u@example.com");
        assertThat(body.getValue()).contains(RESET_URL + result.get().rawToken());
    }

    @Test
    void issueForEmail_fallsBackToClubMember() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        ClubMember m = ClubMember.builder().id(2L).email("m@example.com").password("old").build();
        when(clubMemberRepository.findByEmail("m@example.com")).thenReturn(Optional.of(m));
        when(repo.findAllBySurfaceAndUserId(eq(PasswordResetToken.Surface.CLUB), eq(2L)))
                .thenReturn(List.of());
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<PasswordResetService.Issued> result = service.issueForEmail("m@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().row().getSurface()).isEqualTo(PasswordResetToken.Surface.CLUB);
        assertThat(result.get().row().getUserId()).isEqualTo(2L);
        verify(clubLeaderRepository, never()).findByEmail(any());
    }

    @Test
    void issueForEmail_fallsBackToClubLeader() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(clubMemberRepository.findByEmail(any())).thenReturn(Optional.empty());
        ClubLeader l = ClubLeader.builder().id(3L).email("l@example.com").password("old").build();
        when(clubLeaderRepository.findByEmail("l@example.com")).thenReturn(Optional.of(l));
        when(repo.findAllBySurfaceAndUserId(eq(PasswordResetToken.Surface.CLUB), eq(3L)))
                .thenReturn(List.of());
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<PasswordResetService.Issued> result = service.issueForEmail("l@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().row().getSurface()).isEqualTo(PasswordResetToken.Surface.CLUB);
        assertThat(result.get().row().getUserId()).isEqualTo(3L);
    }

    @Test
    void issueForEmail_unknownEmail_returnsEmpty_andDoesNotSendEmail() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(clubMemberRepository.findByEmail(any())).thenReturn(Optional.empty());
        when(clubLeaderRepository.findByEmail(any())).thenReturn(Optional.empty());

        Optional<PasswordResetService.Issued> result = service.issueForEmail("nobody@example.com");

        assertThat(result).isEmpty();
        verify(emailService, never()).send(anyString(), anyString(), anyString());
        verify(repo, never()).save(any());
    }

    // ── consume() — error paths ─────────────────────────────────────

    @Test
    void consume_unknownToken_throwsInvalidResetTokenException() {
        when(repo.findByTokenHash(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consume("raw", "Newpass1"))
                .isInstanceOf(PasswordResetService.InvalidResetTokenException.class);

        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    void consume_alreadyConsumedToken_throws() {
        PasswordResetToken consumed = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.INNOVATION)
                .userId(1L)
                .tokenHash("hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .consumedAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(consumed));

        assertThatThrownBy(() -> service.consume("raw", "Newpass1"))
                .isInstanceOf(PasswordResetService.InvalidResetTokenException.class)
                .hasMessageContaining("used");
    }

    @Test
    void consume_expiredToken_throws() {
        PasswordResetToken expired = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.INNOVATION)
                .userId(1L)
                .tokenHash("hash")
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.consume("raw", "Newpass1"))
                .isInstanceOf(PasswordResetService.InvalidResetTokenException.class)
                .hasMessageContaining("expired");
    }

    // ── consume() — happy path per principal kind ───────────────────

    @Test
    void consume_regularUser_encodesAndUpdatesPassword() {
        PasswordResetToken row = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.INNOVATION)
                .userId(1L)
                .tokenHash("hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        User u = User.builder().id(1L).email("u@example.com").password("old").build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(row));
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(passwordEncoder.encode("Newpass1")).thenReturn("encoded-new");

        PasswordResetService.ConsumeResult result = service.consume("raw", "Newpass1");

        assertThat(result.surface()).isEqualTo(PasswordResetToken.Surface.INNOVATION);
        assertThat(result.userId()).isEqualTo(1L);
        assertThat(u.getPassword()).isEqualTo("encoded-new");
        verify(userRepository).save(u);
    }

    @Test
    void consume_clubMember_encodesAndUpdatesPassword() {
        PasswordResetToken row = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.CLUB)
                .userId(2L)
                .tokenHash("hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        ClubMember m = ClubMember.builder().id(2L).email("m@example.com").password("old").build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(row));
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clubMemberRepository.findById(2L)).thenReturn(Optional.of(m));
        when(passwordEncoder.encode("Newpass1")).thenReturn("encoded-new");

        PasswordResetService.ConsumeResult result = service.consume("raw", "Newpass1");

        assertThat(result.surface()).isEqualTo(PasswordResetToken.Surface.CLUB);
        assertThat(m.getPassword()).isEqualTo("encoded-new");
        verify(clubMemberRepository).save(m);
    }

    @Test
    void consume_clubLeader_encodesAndUpdatesPassword() {
        PasswordResetToken row = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.CLUB)
                .userId(3L)
                .tokenHash("hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        ClubLeader l = ClubLeader.builder().id(3L).email("l@example.com").password("old").build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(row));
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clubMemberRepository.findById(3L)).thenReturn(Optional.empty());
        when(clubLeaderRepository.findById(3L)).thenReturn(Optional.of(l));
        when(passwordEncoder.encode("Newpass1")).thenReturn("encoded-new");

        PasswordResetService.ConsumeResult result = service.consume("raw", "Newpass1");

        assertThat(l.getPassword()).isEqualTo("encoded-new");
        verify(clubLeaderRepository).save(l);
    }

    // ── consume() — refresh-token revocation ────────────────────────

    @Test
    void consume_revokesAllRefreshTokens_forPrincipal_beforeMarkingConsumed() {
        PasswordResetToken row = PasswordResetToken.builder()
                .id(1L)
                .surface(PasswordResetToken.Surface.INNOVATION)
                .userId(1L)
                .tokenHash("hash")
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .build();
        User u = User.builder().id(1L).email("u@example.com").password("old").build();
        when(repo.findByTokenHash(any())).thenReturn(Optional.of(row));
        when(repo.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");

        service.consume("raw", "Newpass1");

        // The kill switch fired with the right surface + userId + a current instant.
        ArgumentCaptor<RefreshToken.Surface> surfaceCap = ArgumentCaptor.forClass(RefreshToken.Surface.class);
        ArgumentCaptor<Long> userIdCap = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<Instant> nowCap = ArgumentCaptor.forClass(Instant.class);
        verify(refreshTokenRepository, times(1))
                .revokeAllForPrincipal(surfaceCap.capture(), userIdCap.capture(), nowCap.capture());
        assertThat(surfaceCap.getValue()).isEqualTo(RefreshToken.Surface.INNOVATION);
        assertThat(userIdCap.getValue()).isEqualTo(1L);
        assertThat(nowCap.getValue()).isBeforeOrEqualTo(Instant.now());
    }

    // ── consume() — password shape enforcement ──────────────────────

    @Test
    void consume_tooShortPassword_throwsIllegalArgument() {
        // The service-layer shape check runs BEFORE the repo lookup, so no
        // mocks need stubbing. The exception itself is the assertion.
        assertThatThrownBy(() -> service.consume("raw", "abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6 characters");
        verify(repo, never()).save(any());
    }

    @Test
    void consume_passwordWithoutDigit_throwsIllegalArgument() {
        assertThatThrownBy(() -> service.consume("raw", "noDigitsHere"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("digit");
        verify(repo, never()).save(any());
    }
}
