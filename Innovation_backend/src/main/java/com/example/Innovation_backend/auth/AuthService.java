package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.config.RefreshProperties;
import com.example.Innovation_backend.organization.OrganizationService;
import com.example.Innovation_backend.security.CookieUtils;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.LoginRequest;
import com.example.Innovation_backend.user.dto.RegisterRequest;
import com.example.Innovation_backend.user.dto.UserResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OrganizationService organizationService;
    private final RefreshTokenService refreshTokens;
    private final CookieUtils cookieUtils;
    private final RefreshProperties refreshProps;
    private final EmailVerificationService emailVerification;

    /**
     * Register a user, optionally bootstrap a pending Organization for funders,
     * kick off the email-verification flow, and return the auth response.
     * The refresh cookie is written by the caller (controller).
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        UserResponse created = userService.register(req);

        if (created.role() == Role.FUNDER) {
            User funder = userRepository.findByEmail(created.email())
                    .orElseThrow(() -> new IllegalStateException(
                            "Just-created funder not found: " + created.email()));
            organizationService.createPendingForFunder(funder);
        }

        // Phase 6B — issue a verification token and email the link. Failures
        // are swallowed inside EmailService, so this never blocks registration.
        emailVerification.issue(
                EmailVerificationToken.Surface.INNOVATION,
                created.id(),
                created.email()
        );

        String accessToken = jwtService.issue(created.email(), created.id(), created.role().json());
        return new AuthResponse(accessToken, created);
    }

    /** Phase 6B — consume a verification token and mark the user verified. */
    @Transactional
    public void verifyEmail(String rawToken) {
        EmailVerificationToken row = emailVerification.consume(rawToken);
        if (row.getSurface() != EmailVerificationToken.Surface.INNOVATION) {
            throw new EmailVerificationService.InvalidVerificationTokenException(
                    "Token belongs to a different surface");
        }
        User u = userRepository.findById(row.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "User vanished during verification: id=" + row.getUserId()));
        u.setEmailVerified(true);
        userRepository.save(u);
    }

    /** Phase 6B — re-issue a verification token for the calling principal. */
    @Transactional
    public void resendVerification() {
        String email = currentPrincipalEmail();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (u.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }
        emailVerification.issue(
                EmailVerificationToken.Surface.INNOVATION,
                u.getId(),
                u.getEmail()
        );
    }

    private String currentPrincipalEmail() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }
        return auth.getName().trim().toLowerCase();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();
        User u = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), u.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!"active".equals(u.getStatus())) {
            throw new BadCredentialsException("Account is " + u.getStatus());
        }

        UserResponse ur = UserResponse.fromEntity(u);
        String token = jwtService.issue(u.getEmail(), u.getId(), u.getRole().json());
        return new AuthResponse(token, ur);
    }

    /**
     * Rotate a refresh token. Returns the new access token + the user view, and
     * writes the new refresh cookie via {@code response}. Caller does not need
     * to touch the cookie — this method does it.
     */
    @Transactional
    public AuthResponse refresh(String rawRefreshToken, HttpServletResponse response) {
        RefreshTokenService.Issued next = refreshTokens.rotate(rawRefreshToken);
        if (next.row().getSurface() != RefreshToken.Surface.INNOVATION) {
            throw new RefreshTokenService.InvalidRefreshException(
                    "Refresh token belongs to a different surface");
        }
        User u = userRepository.findById(next.row().getUserId())
                .orElseThrow(() -> new BadCredentialsException("User no longer exists"));

        String access = jwtService.issue(u.getEmail(), u.getId(), u.getRole().json());
        cookieUtils.writeRefreshCookie(response, next.rawToken());
        return new AuthResponse(access, UserResponse.fromEntity(u));
    }

    /** Revoke the presented refresh token (if any) and clear the cookie. */
    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        refreshTokens.revoke(rawRefreshToken);
        cookieUtils.clearRefreshCookie(response);
    }

    /** Access-token TTL (ms) — used for the X-Access-Expires-In-Ms response header. */
    public long accessExpirationMs() {
        return refreshProps.accessExpirationMs();
    }
}
