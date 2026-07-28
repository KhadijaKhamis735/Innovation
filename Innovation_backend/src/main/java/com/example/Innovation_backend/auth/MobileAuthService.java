package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service layer for the mobile JSON auth flow at {@code /api/mobile/auth/**}.
 * <p>
 * Purpose: hand back the raw refresh token in the response body (mobile
 * clients store it in SecureStore) instead of writing an HttpOnly cookie.
 * Otherwise this reuses {@link AuthService}, {@link RefreshTokenService},
 * {@link EmailVerificationService}, and {@link PasswordResetService}
 * verbatim — same JWTs, same rotation, same reuse detection, same
 * verification/reset semantics. Web cookies are untouched.
 * <p>
 * Surface: every refresh token issued from this service is tagged
 * {@link RefreshToken.Surface#INNOVATION} so {@code AuthService.refresh}
 * rejects it with {@code InvalidRefreshException} if the wrong surface
 * ever shows up.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MobileAuthService {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokens;
    private final JwtService jwtService;

    /**
     * Register a new mobile user, kick off the verification email flow, mint
     * a refresh token, and return the JSON-friendly bundle.
     */
    @Transactional
    public MobileAuthResponse register(RegisterRequest req) {
        AuthResponse auth = authService.register(req);
        User u = userRepository.findByEmail(auth.user().email())
                .orElseThrow(() -> new IllegalStateException(
                        "Just-created user not found: " + auth.user().email()));
        return buildResponse(auth, u.getId());
    }

    /**
     * Authenticate by email/password and return the bundle. Bad credentials
     * bubble up as {@link BadCredentialsException} → 401 (handled by the
     * global exception mapper).
     * <p>
     * Not {@code readOnly}: this method mints a refresh token row, which is
     * a write. A read-only transaction here would propagate into
     * {@link RefreshTokenService#issue} and Postgres would reject the INSERT
     * with "cannot execute INSERT in a read-only transaction".
     */
    @Transactional
    public MobileAuthResponse login(LoginRequest req) {
        AuthResponse auth = authService.login(req);
        User u = userRepository.findByEmail(auth.user().email())
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));
        return buildResponse(auth, u.getId());
    }

    /**
     * Rotate the refresh token and return a fresh bundle. Reuse / expiry /
     * wrong surface all surface as the same exceptions {@link RefreshTokenService}
     * already throws — the global mapper handles the HTTP code.
     */
    @Transactional
    public MobileAuthResponse refresh(String rawToken) {
        RefreshTokenService.Issued issued = refreshTokens.rotate(rawToken);
        if (issued.row().getSurface() != RefreshToken.Surface.INNOVATION) {
            // Defensive: the same token table is shared with the club surface,
            // and mobile clients must never be allowed to refresh club tokens.
            throw new RefreshTokenService.InvalidRefreshException(
                    "Refresh token belongs to a different surface");
        }
        User u = userRepository.findById(issued.row().getUserId())
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));
        String access = jwtService.issue(u.getEmail(), u.getId(), u.getRole().json());
        return new MobileAuthResponse(
                access,
                issued.rawToken(),
                issued.row().getExpiresAt(),
                UserResponse.fromEntity(u));
    }

    /**
     * Revoke a single refresh token (logout). Unknown tokens are no-ops — we
     * still return so the client never learns whether the token existed.
     */
    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokens.revoke(rawToken);
    }

    // ── helpers ────────────────────────────────────────────────────────

    private MobileAuthResponse buildResponse(AuthResponse auth, Long userId) {
        RefreshTokenService.Issued issued = refreshTokens.issue(
                RefreshToken.Surface.INNOVATION, userId);
        return new MobileAuthResponse(
                auth.token(),
                issued.rawToken(),
                issued.row().getExpiresAt(),
                auth.user());
    }
}