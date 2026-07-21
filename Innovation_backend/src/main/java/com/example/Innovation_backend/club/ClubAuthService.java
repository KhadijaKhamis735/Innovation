package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.ClubAuthResponse;
import com.example.Innovation_backend.club.dto.ClubLoginRequest;
import com.example.Innovation_backend.club.dto.ClubRegisterRequest;
import com.example.Innovation_backend.club.dto.MemberResponse;
import com.example.Innovation_backend.common.DataSeedRunner; // for the test-only fallback club
import com.example.Innovation_backend.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
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
        return ClubAuthResponse.forMember(token, saved);
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