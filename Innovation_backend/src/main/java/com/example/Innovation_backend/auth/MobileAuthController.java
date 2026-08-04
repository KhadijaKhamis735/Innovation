package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.ForgotPasswordRequest;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.ResendVerificationRequest;
import com.example.Innovation_backend.user.dto.ResetPasswordRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * JSON auth surface for React Native clients. Mirrors {@link AuthController}
 * but returns the raw refresh token in the response body and accepts it
 * back in the body on refresh/logout — React Native has no reliable
 * cross-platform cookie jar, and HttpOnly cookies are not usable from JS
 * anyway.
 * <p>
 * All other semantics — JWT shape, refresh rotation, family tracking,
 * reuse detection, verification email, password reset — are unchanged
 * and delegated to the same services the web endpoints use.
 */
@RestController
@RequestMapping("/api/mobile/auth")
@RequiredArgsConstructor
public class MobileAuthController {

    private final MobileAuthService mobileAuth;
    private final AuthService authService;
    private final UserService userService;
    private final EmailVerificationService emailVerification;
    private final PasswordResetService passwordReset;

    @PostMapping("/register")
    public ResponseEntity<MobileAuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mobileAuth.register(req));
    }

    @PostMapping("/login")
    public MobileAuthResponse login(@Valid @RequestBody LoginRequest req) {
        return mobileAuth.login(req);
    }

    @PostMapping("/refresh")
    public MobileAuthResponse refresh(@Valid @RequestBody MobileRefreshRequest req) {
        return mobileAuth.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) MobileLogoutRequest req) {
        String raw = req == null ? null : req.refreshToken();
        mobileAuth.logout(raw);
        return ResponseEntity.noContent().build();
    }

    /**
     * Consume an email verification token. Public — the user may not be
     * logged in yet when they tap the email link.
     */
    @GetMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new VerifyResponse(true, "Email verified"));
    }

    /** Re-send the verification email to the calling principal. */
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        authService.resendVerification(LinkAudience.MOBILE);
        return ResponseEntity.accepted().build();
    }

    /**
     * Email-bodied resend for users who closed the app right after registering
     * and have no session. Always returns 202 whether or not the email is
     * registered or already verified — same anti-enumeration contract as
     * {@code forgot-password}.
     */
    @PostMapping("/resend-verification-by-email")
    public ResponseEntity<Void> resendVerificationByEmail(@Valid @RequestBody ResendVerificationRequest req) {
        authService.resendVerificationForEmail(req.email(), LinkAudience.MOBILE);
        return ResponseEntity.accepted().build();
    }

    /**
     * Start a password reset. Always returns 202 whether or not the email
     * is registered, so an attacker can't enumerate accounts.
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

    /** Current user from JWT — equivalent to GET /api/auth/me. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserDetails principal) {
        User u = userService.findByEmail(principal.getUsername());
        return UserResponse.fromEntity(u);
    }

    /** Same lightweight body used by the web verify endpoint. */
    public record VerifyResponse(boolean verified, String message) {}
}