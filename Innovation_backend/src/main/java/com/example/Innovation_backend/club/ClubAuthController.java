package com.example.Innovation_backend.club;

import com.example.Innovation_backend.auth.PasswordResetService;
import com.example.Innovation_backend.auth.RefreshTokenService;
import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubLoginRequest;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import com.example.Innovation_backend.club.dto.UniversityResponse;
import com.example.Innovation_backend.security.CookieUtils;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.dto.ForgotPasswordRequest;
import com.example.Innovation_backend.user.dto.ResetPasswordRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * Auth endpoints for the club surface (separate from /api/auth/*).
 *
 *   POST /api/club/auth/register                 public — any of 4 categories
 *   POST /api/club/auth/login                    public — members and leaders
 *   POST /api/club/auth/refresh                  public — rotates the refresh cookie
 *   POST /api/club/auth/logout                   public — revokes the refresh token + clears cookie
 *   GET  /api/club/auth/me                       auth   — current principal (member or leader)
 *   GET  /api/club/auth/verify?token=…           public — consume email verification token
 *   POST /api/club/auth/resend-verification      auth   — re-send verification email
 *   POST /api/club/auth/forgot-password          public — start password reset
 *   POST /api/club/auth/reset-password           public — consume reset token + new password
 *
 * Email uniqueness is global across both club tables (and the main users
 * table, see ApplicationService's pre-check on /api/auth/register).
 */
@RestController
@RequestMapping("/api/club/auth")
@RequiredArgsConstructor
public class ClubAuthController {

    private final ClubAuthService authService;
    private final CookieUtils cookieUtils;
    private final JwtService jwtService;
    private final PasswordResetService passwordReset;
    private final UniversityRepository universityRepository;

    /**
     * Phase 7 Slice A1 — public roster of universities for the mobile
     * register picker. Returned in display order (shortName ascending)
     * so the same list comes back deterministically on every request.
     * Lives under /api/club/auth/** so SecurityConfig's existing
     * {@code permitAll} rule already covers it.
     */
    @GetMapping("/universities")
    public List<UniversityResponse> universities() {
        return universityRepository.findAll().stream()
                .sorted((a, b) -> a.getShortName().compareTo(b.getShortName()))
                .map(UniversityResponse::from)
                .toList();
    }

    @PostMapping("/register")
    public ResponseEntity<ClubAuthResponse> register(@Valid @RequestBody ClubRegisterRequest req,
                                                     HttpServletResponse response) {
        ClubAuthResponse resp = authService.register(req);
        // Members register here, so the principal is always a member.
        Long userId = resp.member() != null ? resp.member().id() : null;
        if (userId != null) {
            authService.withRefreshCookie(resp, userId, response);
        }
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return ResponseEntity
                .created(URI.create("/api/club/members/" + resp.member().id()))
                .body(resp);
    }

    @PostMapping("/login")
    public ClubAuthResponse login(@Valid @RequestBody ClubLoginRequest req,
                                  HttpServletResponse response) {
        ClubAuthResponse resp = authService.login(req);
        Long userId = resp.member() != null ? resp.member().id()
                       : resp.leader() != null ? resp.leader().id() : null;
        if (userId != null) {
            authService.withRefreshCookie(resp, userId, response);
        }
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return resp;
    }

    @PostMapping("/refresh")
    public ClubAuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String raw = cookieUtils.readRefreshCookie(request);
        if (raw == null) {
            throw new RefreshTokenService.InvalidRefreshException("No refresh token cookie");
        }
        ClubAuthResponse resp = authService.refresh(raw, response);
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return resp;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String raw = cookieUtils.readRefreshCookie(request);
        authService.logout(raw, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public Object me() {
        return authService.me();
    }

    /** Phase 6B — consume an email verification token (public, called from email link). */
    @GetMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestParam("token") String token) {
        authService.verifyClubEmail(token);
        return ResponseEntity.ok(new VerifyResponse(true, "Email verified"));
    }

    /** Phase 6B — re-send the verification email to the calling principal. */
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        authService.resendClubVerification();
        return ResponseEntity.accepted().build();
    }

    /**
     * Phase 6C — start a password reset. Always returns 202 (no email
     * enumeration) — even club members/leaders share the same email lookup
     * path as innovation users, so the service will find them by email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.issueForEmail(req.email());
        return ResponseEntity.accepted().build();
    }

    /** Phase 6C — consume a reset token and set a new password. */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.consume(req.token(), req.password());
        return ResponseEntity.noContent().build();
    }

    /** Same shape as AuthController.VerifyResponse — kept local to avoid a cross-package dep. */
    public record VerifyResponse(boolean verified, String message) {}
}
