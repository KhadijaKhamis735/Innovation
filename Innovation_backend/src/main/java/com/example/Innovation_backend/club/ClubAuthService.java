package com.example.Innovation_backend.club;

import com.example.Innovation_backend.auth.EmailVerificationService;
import com.example.Innovation_backend.auth.EmailVerificationToken;
import com.example.Innovation_backend.auth.LinkAudience;
import com.example.Innovation_backend.auth.RefreshToken;
import com.example.Innovation_backend.auth.RefreshTokenService;
import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubLoginRequest;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import com.example.Innovation_backend.club.dto.MemberResponse;
import com.example.Innovation_backend.common.DataSeedRunner; // for the test-only fallback club
import com.example.Innovation_backend.security.CookieUtils;
import com.example.Innovation_backend.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Auth flow for the club surface. Two parallel tables (members + leaders)
 * share the same email-uniqueness contract as the main {@code users} table.
 *
 * On register the new member is automatically placed in a "default" club for
 * their university. In MVP we seed exactly one branch per university so this
 * is unambiguous; if multiple branches exist later, the request will need a
 * {@code clubId} field added.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClubAuthService {

    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;
    private final ClubRepository clubRepo;
    private final UniversityRepository universityRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokens;
    private final CookieUtils cookieUtils;
    private final EmailVerificationService emailVerification;

    // ── Register ──────────────────────────────────────────────────────

    @Transactional
    public ClubAuthResponse register(ClubRegisterRequest req) {
        if (memberRepo.existsByEmail(req.email().trim().toLowerCase())
                || leaderRepo.existsByEmail(req.email().trim().toLowerCase())) {
            throw new DuplicatePrincipalException(
                    "A club account with that email already exists");
        }

        University uni = universityRepo.findById(req.universityId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "University not found: " + req.universityId()));

        Club club = clubRepo.findAllByStatusOrderByNameAsc(ClubStatus.ACTIVE).stream()
                .filter(c -> c.getUniversity().getId().equals(uni.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No active club exists for university " + uni.getShortName()
                                + ". Ask an admin to create one before registering members."));

        // Category-specific field validation. Done here, not via Bean Validation,
        // because the rules depend on the value of the {@code category} field itself.
        validateCategoryFields(req);

        ClubMember member = ClubMember.builder()
                .email(req.email().trim().toLowerCase())
                .password(passwordEncoder.encode(req.password()))
                .fullName(req.fullName().trim())
                .university(uni)
                .category(req.category())
                .regNumber(trimOrNull(req.regNumber()))
                .staffId(trimOrNull(req.staffId()))
                .graduationYear(req.graduationYear())
                .organizationName(trimOrNull(req.organizationName()))
                .organizationRole(trimOrNull(req.organizationRole()))
                .bio(trimOrNull(req.bio()))
                .status(MembershipStatus.PENDING)
                .club(club)
                // Phase 6B — self-registered members start unverified.
                .emailVerified(false)
                .build();

        ClubMember saved;
        try {
            saved = memberRepo.save(member);
        } catch (DataIntegrityViolationException ex) {
            // Race: another register call beat us to the email. Map to 409.
            throw new DuplicatePrincipalException(
                    "A club account with that email already exists");
        }

        String token = jwtService.issue(saved.getEmail(), saved.getId(), "club-member");
        log.info("ClubMember registered: id={} email={} uni={} club={}",
                saved.getId(), saved.getEmail(), uni.getShortName(), club.getName());

        // Phase 6B — issue a verification token + email the link.
        emailVerification.issue(
                EmailVerificationToken.Surface.CLUB,
                saved.getId(),
                saved.getEmail()
        );

        return ClubAuthResponse.forMember(token, saved);
    }

    // ── Email verification (Phase 6B) ───────────────────────────────────

    @Transactional
    public void verifyClubEmail(String rawToken) {
        EmailVerificationToken row = emailVerification.consume(rawToken);
        if (row.getSurface() != EmailVerificationToken.Surface.CLUB) {
            throw new EmailVerificationService.InvalidVerificationTokenException(
                    "Token belongs to a different surface");
        }
        ClubMember m = memberRepo.findById(row.getUserId())
                .orElseThrow(() -> new IllegalStateException(
                        "ClubMember vanished during verification: id=" + row.getUserId()));
        m.setEmailVerified(true);
        memberRepo.save(m);
    }

    @Transactional
    public void resendClubVerification() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase();
        ClubMember m = memberRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("ClubMember not found: " + email));
        if (m.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }
        emailVerification.issue(
                EmailVerificationToken.Surface.CLUB,
                m.getId(),
                m.getEmail()
        );
    }

    /**
     * Phase 7 — email-bodied variant of {@link #resendClubVerification} for
     * unauthenticated callers (e.g. a mobile user who closed the app right
     * after registering). Mirrors the innovation-side anti-enumeration
     * contract: never throws and never confirms whether the account exists
     * or has already verified. The controller should always return 202.
     */
    @Transactional
    public void resendClubVerificationForEmail(String email) {
        String normalised = email == null ? "" : email.trim().toLowerCase();
        if (normalised.isBlank()) return;

        ClubMember m = memberRepo.findByEmail(normalised).orElse(null);
        if (m == null) {
            log.debug("resendClubVerificationForEmail: unknown principal, suppressing");
            return;
        }
        if (m.isEmailVerified()) {
            log.debug("resendClubVerificationForEmail: already verified, suppressing");
            return;
        }
        emailVerification.issue(
                EmailVerificationToken.Surface.CLUB,
                m.getId(),
                m.getEmail(),
                LinkAudience.MOBILE
        );
    }

    /** Issue a refresh cookie for a freshly-registered member and write it on the response. */
    public ClubAuthResponse withRefreshCookie(ClubAuthResponse body,
                                              Long userId,
                                              HttpServletResponse response) {
        attachRefreshCookie(response, userId);
        return body;
    }

    // ── Login ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ClubAuthResponse login(ClubLoginRequest req) {
        String email = req.email().trim().toLowerCase();

        // Members take precedence on email collision because they self-register;
        // leaders are seeded/admin-managed and unlikely to share an address with
        // a member. (Both tables enforce uniqueness independently anyway.)
        var member = memberRepo.findByEmail(email);
        if (member.isPresent()) {
            ClubMember m = member.get();
            if (!passwordEncoder.matches(req.password(), m.getPassword())) {
                throw new BadCredentialsException("Invalid email or password");
            }
            String token = jwtService.issue(m.getEmail(), m.getId(), "club-member");
            return ClubAuthResponse.forMember(token, m);
        }

        var leader = leaderRepo.findByEmail(email);
        if (leader.isPresent()) {
            ClubLeader l = leader.get();
            if (!"active".equalsIgnoreCase(l.getStatus())) {
                throw new AccessDeniedException("This leader account is inactive");
            }
            if (!passwordEncoder.matches(req.password(), l.getPassword())) {
                throw new BadCredentialsException("Invalid email or password");
            }
            String token = jwtService.issue(l.getEmail(), l.getId(), "club-leader");
            return ClubAuthResponse.forLeader(token, l);
        }

        throw new BadCredentialsException("Invalid email or password");
    }

    // ── Refresh / logout ──────────────────────────────────────────────

    @Transactional
    public ClubAuthResponse refresh(String rawRefreshToken, HttpServletResponse response) {
        RefreshTokenService.Issued next = refreshTokens.rotate(rawRefreshToken);
        if (next.row().getSurface() != RefreshToken.Surface.CLUB) {
            throw new RefreshTokenService.InvalidRefreshException(
                    "Refresh token belongs to a different surface");
        }
        Long userId = next.row().getUserId();
        cookieUtils.writeRefreshCookie(response, next.rawToken());

        // Members take precedence on id-collision because they self-register;
        // leaders are admin-managed. Both tables enforce uniqueness.
        var member = memberRepo.findById(userId);
        if (member.isPresent()) {
            ClubMember m = member.get();
            String access = jwtService.issue(m.getEmail(), m.getId(), "club-member");
            return ClubAuthResponse.forMember(access, m);
        }
        var leader = leaderRepo.findById(userId);
        if (leader.isPresent()) {
            ClubLeader l = leader.get();
            String access = jwtService.issue(l.getEmail(), l.getId(), "club-leader");
            return ClubAuthResponse.forLeader(access, l);
        }
        throw new BadCredentialsException("Club principal no longer exists");
    }

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        refreshTokens.revoke(rawRefreshToken);
        cookieUtils.clearRefreshCookie(response);
    }

    private void attachRefreshCookie(HttpServletResponse response, Long userId) {
        RefreshTokenService.Issued issued = refreshTokens.issue(RefreshToken.Surface.CLUB, userId);
        cookieUtils.writeRefreshCookie(response, issued.rawToken());
    }

    // ── Me ────────────────────────────────────────────────────────────

    /**
     * Return the calling principal's profile. Used by the frontend's
     * ClubContext to hydrate after a hard reload.
     */
    @Transactional(readOnly = true)
    public Object me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase();
        String role = principalRole(auth);

        if ("club-member".equalsIgnoreCase(role)) {
            return memberRepo.findByEmail(email)
                    .map(MemberResponse::from)
                    .orElseThrow(() -> new EntityNotFoundException("ClubMember not found: " + email));
        }
        if ("club-leader".equalsIgnoreCase(role)) {
            return leaderRepo.findByEmail(email)
                    .map(ClubAuthResponse.LeaderView::from)
                    .orElseThrow(() -> new EntityNotFoundException("ClubLeader not found: " + email));
        }
        throw new AccessDeniedException(
                "Token role is not a club role: '" + role + "'");
    }

    /** Inspect the authorities the JWT filter set on the SecurityContext. */
    private String principalRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority())
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .map(String::toLowerCase)
                .orElse("");
    }

    // ── Internals ─────────────────────────────────────────────────────

    private void validateCategoryFields(ClubRegisterRequest req) {
        switch (req.category()) {
            case STUDENT -> require(req.regNumber(), "regNumber is required for STUDENT");
            case STAFF -> require(req.staffId(), "staffId is required for STAFF");
            case ALUMNI -> require(req.graduationYear(), "graduationYear is required for ALUMNI");
            case CORPORATE -> {
                require(req.organizationName(), "organizationName is required for CORPORATE");
                require(req.organizationRole(), "organizationRole is required for CORPORATE");
            }
        }
    }

    private static void require(Object value, String message) {
        if (value == null || (value instanceof String s && s.isBlank())) {
            throw new IllegalArgumentException(message);
        }
    }

    private static String trimOrNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /** Thrown when an email is already taken on either members or leaders. */
    public static class DuplicatePrincipalException extends RuntimeException {
        public DuplicatePrincipalException(String message) { super(message); }
    }
}