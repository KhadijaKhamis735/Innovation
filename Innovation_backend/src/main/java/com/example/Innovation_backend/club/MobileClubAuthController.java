package com.example.Innovation_backend.club;

import com.example.Innovation_backend.auth.EmailVerificationService;
import com.example.Innovation_backend.auth.LinkAudience;
import com.example.Innovation_backend.auth.PasswordResetService;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import com.example.Innovation_backend.club.dto.MobileClubAuthResponse;
import com.example.Innovation_backend.club.dto.MobileClubLogoutRequest;
import com.example.Innovation_backend.club.dto.MobileClubRefreshRequest;
import com.example.Innovation_backend.user.dto.ForgotPasswordRequest;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * JSON auth surface for React Native clients on the club domain. Mirrors
 * {@link ClubAuthController} but returns the raw refresh token in the
 * response body and accepts it back in the body on refresh/logout —
 * React Native has no reliable cross-platform cookie jar, and HttpOnly
 * cookies are not usable from JS anyway.
 *
 * All other semantics — JWT shape, refresh rotation, family tracking,
 * reuse detection, verification email, password reset — are unchanged
 * and delegated to the same services the web endpoints use.
 *
 * Web endpoints at /api/club/auth/* are untouched.
 */
@RestController
@RequestMapping("/api/mobile/club/auth")
@RequiredArgsConstructor
public class MobileClubAuthController {

    private final MobileClubAuthService mobileClubAuth;
    private final ClubAuthService clubAuth;
    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;
    private final EmailVerificationService emailVerification;
    private final PasswordResetService passwordReset;

    @PostMapping("/register")
    public ResponseEntity<MobileClubAuthResponse> register(@Valid @RequestBody ClubRegisterRequest req) {
        // Members register here; leaders are admin-created only. The service
        // throws if it sees a leader payload come back.
        return ResponseEntity.status(HttpStatus.CREATED).body(mobileClubAuth.register(req));
    }

    @PostMapping("/login")
    public MobileClubAuthResponse login(@Valid @RequestBody LoginRequest req) {
        return mobileClubAuth.login(req);
    }

    @PostMapping("/refresh")
    public MobileClubAuthResponse refresh(@Valid @RequestBody MobileClubRefreshRequest req) {
        return mobileClubAuth.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) MobileClubLogoutRequest req) {
        String raw = req == null ? null : req.refreshToken();
        mobileClubAuth.logout(raw);
        return ResponseEntity.noContent().build();
    }

    /**
     * Consume an email verification token. Public — the user may not be
     * logged in yet when they tap the email link. Email links always use
     * the surface-prefixed URL the web controller already accepts, so a
     * single verification endpoint covers both clients.
     */
    @GetMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestParam("token") String token) {
        clubAuth.verifyClubEmail(token);
        return ResponseEntity.ok(new VerifyResponse(true, "Email verified"));
    }

    /**
     * Re-send the verification email to the calling principal. Same shape
     * as the web endpoint; uses {@link LinkAudience#MOBILE} so the email
     * primaries the {@code innovationmobile://} deep link.
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        clubAuth.resendClubVerification();
        return ResponseEntity.accepted().build();
    }

    /**
     * Phase 7 — email-bodied resend for users who closed the app right
     * after registering and have no session. Always returns 202 whether or
     * not the email is registered or already verified — same anti-
     * enumeration contract as forgot-password. Used by CheckEmailScreen.
     */
    @PostMapping("/resend-verification-by-email")
    public ResponseEntity<Void> resendVerificationByEmail(@RequestBody com.example.Innovation_backend.user.dto.ResendVerificationRequest req) {
        clubAuth.resendClubVerificationForEmail(req.email());
        return ResponseEntity.accepted().build();
    }

    /**
     * Start a password reset. Always returns 202 whether or not the email
     * is registered, so an attacker can't enumerate accounts. The club
     * surface reuses {@link PasswordResetService#issueForEmail} which
     * already probes User → ClubMember → ClubLeader.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.issueForEmail(req.email(), LinkAudience.MOBILE);
        return ResponseEntity.accepted().build();
    }

    /**
     * Consume a reset token and set a new password. Kills all existing
     * refresh sessions for the principal.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.consume(req.token(), req.password());
        return ResponseEntity.noContent().build();
    }

    /**
     * Current principal — same shape as GET /api/club/auth/me but routed
     * by JWT, not by cookie. Returns a {@code MemberResponse} or
     * {@code LeaderView} depending on which table the principal lives in.
     */
    @GetMapping("/me")
    public Object me(@AuthenticationPrincipal UserDetails principal) {
        String email = principal.getUsername().trim().toLowerCase();
        // JWT filter sets ROLE_CLUB_MEMBER / ROLE_CLUB_LEADER as authorities;
        // pick the matching table.
        boolean isLeader = principal.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLUB_LEADER".equalsIgnoreCase(a.getAuthority()));
        if (isLeader) {
            return leaderRepo.findByEmail(email)
                    .map(MobileLeaderView::from)
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                            "ClubLeader not found: " + email));
        }
        return memberRepo.findByEmail(email)
                .map(MobileMemberView::from)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException(
                        "ClubMember not found: " + email));
    }

    /** Same lightweight body used by the web verify endpoint. */
    public record VerifyResponse(boolean verified, String message) {}

    /**
     * Compact member view for the mobile /me endpoint. Mirrors the
     * existing web {@code MemberResponse} but with just the fields the
     * mobile shell renders — keeps the wire small. Other dashboards
     * will fetch richer projections from /api/club/members/{id} later.
     */
    public record MobileMemberView(
            Long id,
            String email,
            String fullName,
            Long universityId,
            String universityShortName,
            MemberCategory category,
            String regNumber,
            String staffId,
            Integer graduationYear,
            String organizationName,
            String organizationRole,
            String bio,
            MembershipStatus status,
            Long clubId,
            String clubName,
            boolean emailVerified
    ) {
        public static MobileMemberView from(ClubMember m) {
            return new MobileMemberView(
                    m.getId(),
                    m.getEmail(),
                    m.getFullName(),
                    m.getUniversity().getId(),
                    m.getUniversity().getShortName(),
                    m.getCategory(),
                    m.getRegNumber(),
                    m.getStaffId(),
                    m.getGraduationYear(),
                    m.getOrganizationName(),
                    m.getOrganizationRole(),
                    m.getBio(),
                    m.getStatus(),
                    m.getClub().getId(),
                    m.getClub().getName(),
                    m.isEmailVerified());
        }
    }

    public record MobileLeaderView(
            Long id,
            String email,
            String fullName,
            Long universityId,
            String universityShortName,
            ClubLeaderRole role,
            String phone,
            String status
    ) {
        public static MobileLeaderView from(ClubLeader l) {
            return new MobileLeaderView(
                    l.getId(),
                    l.getEmail(),
                    l.getFullName(),
                    l.getUniversity().getId(),
                    l.getUniversity().getShortName(),
                    l.getRole(),
                    l.getPhone(),
                    l.getStatus());
        }
    }
}