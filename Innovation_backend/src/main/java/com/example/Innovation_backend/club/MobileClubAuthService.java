package com.example.Innovation_backend.club;

import com.example.Innovation_backend.auth.LinkAudience;
import com.example.Innovation_backend.auth.RefreshToken;
import com.example.Innovation_backend.auth.RefreshTokenService;
import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import com.example.Innovation_backend.club.dto.MobileClubAuthResponse;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.dto.LoginRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service layer for the mobile JSON auth flow at {@code /api/mobile/club/auth/**}.
 *
 * Purpose: hand back the raw refresh token in the response body (mobile
 * clients store it in SecureStore) instead of writing an HttpOnly cookie.
 * Otherwise this reuses {@link ClubAuthService}, {@link RefreshTokenService},
 * and {@link com.example.Innovation_backend.auth.PasswordResetService}
 * verbatim — same JWTs, same rotation, same reuse detection, same
 * verification/reset semantics. Web cookies are untouched.
 *
 * Surface: every refresh token issued from this service is tagged
 * {@link RefreshToken.Surface#CLUB} so {@code RefreshTokenService.rotate}
 * and any future cross-surface checks stay consistent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MobileClubAuthService {

    private final ClubAuthService clubAuth;
    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;
    private final RefreshTokenService refreshTokens;
    private final JwtService jwtService;

    /**
     * Register a new club member. Always issues a {@link RefreshToken.Surface#CLUB}
     * refresh token (the web controller does the same — club leaders are
     * admin-created and never self-register).
     */
    @Transactional
    public MobileClubAuthResponse register(ClubRegisterRequest req) {
        ClubAuthResponse resp = clubAuth.register(req);
        Long userId = resp.member() != null ? resp.member().id() : null;
        if (userId == null) {
            throw new IllegalStateException(
                    "ClubAuthService.register returned a leader payload; leaders must be admin-created");
        }
        return buildMemberResponse(resp, userId);
    }

    /**
     * Authenticate by email/password against either the members or leaders
     * table. Bad credentials bubble up as {@link BadCredentialsException}
     * → 401 (handled by the global exception mapper).
     *
     * Not {@code readOnly}: this method mints a refresh token row, which is
     * a write. A read-only transaction here would propagate into
     * {@link RefreshTokenService#issue} and Postgres would reject the INSERT
     * with "cannot execute INSERT in a read-only transaction".
     */
    @Transactional
    public MobileClubAuthResponse login(LoginRequest req) {
        ClubAuthResponse resp = clubAuth.login(new com.example.Innovation_backend.club.dto.ClubLoginRequest(
                req.email(), req.password()));
        Long userId = resp.member() != null ? resp.member().id()
                       : resp.leader() != null ? resp.leader().id() : null;
        if (userId == null) {
            throw new BadCredentialsException("Club principal no longer exists");
        }
        RefreshTokenService.Issued issued = refreshTokens.issue(
                RefreshToken.Surface.CLUB, userId);
        return new MobileClubAuthResponse(
                resp.token(),
                issued.rawToken(),
                issued.row().getExpiresAt(),
                resp.role(),
                resp.kind(),
                resp.member(),
                resp.leader());
    }

    /**
     * Rotate the refresh token and return a fresh bundle. Reuse / expiry /
     * wrong surface all surface as the same exceptions {@link RefreshTokenService}
     * already throws — the global mapper handles the HTTP code.
     */
    @Transactional
    public MobileClubAuthResponse refresh(String rawToken) {
        RefreshTokenService.Issued issued = refreshTokens.rotate(rawToken);
        if (issued.row().getSurface() != RefreshToken.Surface.CLUB) {
            // Defensive: the same token table is shared with the Innovation surface,
            // and mobile clients must never be allowed to refresh innovation tokens
            // through the club endpoint.
            throw new RefreshTokenService.InvalidRefreshException(
                    "Refresh token belongs to a different surface");
        }
        Long userId = issued.row().getUserId();
        // Members take precedence on id-collision because they self-register;
        // leaders are admin-managed. Both tables enforce uniqueness independently.
        var member = memberRepo.findById(userId);
        if (member.isPresent()) {
            ClubMember m = member.get();
            String access = jwtService.issue(m.getEmail(), m.getId(), "club-member");
            return new MobileClubAuthResponse(
                    access,
                    issued.rawToken(),
                    issued.row().getExpiresAt(),
                    "club-member",
                    "MEMBER",
                    ClubAuthResponse.MemberView.from(m),
                    null);
        }
        var leader = leaderRepo.findById(userId);
        if (leader.isPresent()) {
            ClubLeader l = leader.get();
            String access = jwtService.issue(l.getEmail(), l.getId(), "club-leader");
            return new MobileClubAuthResponse(
                    access,
                    issued.rawToken(),
                    issued.row().getExpiresAt(),
                    "club-leader",
                    "LEADER",
                    null,
                    ClubAuthResponse.LeaderView.from(l));
        }
        throw new BadCredentialsException("Club principal no longer exists");
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

    /**
     * Build a register-response. The web register path also writes a refresh
     * cookie via {@link ClubAuthService#withRefreshCookie}; on mobile we
     * additionally surface the raw token in the body.
     */
    private MobileClubAuthResponse buildMemberResponse(ClubAuthResponse resp, Long userId) {
        RefreshTokenService.Issued issued = refreshTokens.issue(
                RefreshToken.Surface.CLUB, userId);
        return new MobileClubAuthResponse(
                resp.token(),
                issued.rawToken(),
                issued.row().getExpiresAt(),
                resp.role(),
                resp.kind(),
                resp.member(),
                resp.leader());
    }
}