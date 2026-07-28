package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.security.CookieUtils;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.ForgotPasswordRequest;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.ResetPasswordRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final RefreshTokenService refreshTokens;
    private final CookieUtils cookieUtils;
    private final JwtService jwtService;
    private final PasswordResetService passwordReset;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req,
                                                HttpServletResponse response) {
        AuthResponse body = authService.register(req);
        // Issue a refresh cookie for the newly-created principal. We need the user id
        // so we look it up by email — register() just persisted the row.
        User u = userService.findByEmail(body.user().email());
        attachRefreshCookie(response, RefreshToken.Surface.INNOVATION, u.getId());
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req,
                              HttpServletResponse response) {
        AuthResponse body = authService.login(req);
        User u = userService.findByEmail(body.user().email());
        attachRefreshCookie(response, RefreshToken.Surface.INNOVATION, u.getId());
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return body;
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String raw = cookieUtils.readRefreshCookie(request);
        if (raw == null) {
            throw new RefreshTokenService.InvalidRefreshException("No refresh token cookie");
        }
        AuthResponse body = authService.refresh(raw, response);
        response.setHeader("X-Access-Expires-In-Ms", String.valueOf(jwtService.accessExpirationMs()));
        return body;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String raw = cookieUtils.readRefreshCookie(request);
        authService.logout(raw, response);
        return ResponseEntity.noContent().build();
    }

    /** Current user from JWT — equivalent to GET /api/users/me. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserDetails principal) {
        User u = userService.findByEmail(principal.getUsername());
        return UserResponse.fromEntity(u);
    }

    /**
     * Phase 6B — consume an email verification token. Public (the user may not
     * be logged in yet when they click the email link).
     */
    @GetMapping("/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestParam("token") String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new VerifyResponse(true, "Email verified"));
    }

    /** Phase 6B — re-send the verification email to the calling principal. */
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification() {
        authService.resendVerification();
        return ResponseEntity.accepted().build();
    }

    /**
     * Phase 6C — start a password reset. Always returns 202 even when the email
     * is unknown, to avoid leaking which addresses are registered.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordReset.issueForEmail(req.email());
        return ResponseEntity.accepted().build();
    }

    /**
     * Phase 6C — consume a reset token and set a new password. Kills all
     * existing refresh tokens for the principal.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordReset.consume(req.token(), req.password());
        return ResponseEntity.noContent().build();
    }

    /** Lightweight response body for the verify endpoint. */
    public record VerifyResponse(boolean verified, String message) {}

    private void attachRefreshCookie(HttpServletResponse response,
                                     RefreshToken.Surface surface,
                                     Long userId) {
        RefreshTokenService.Issued issued = refreshTokens.issue(surface, userId);
        cookieUtils.writeRefreshCookie(response, issued.rawToken());
    }
}
