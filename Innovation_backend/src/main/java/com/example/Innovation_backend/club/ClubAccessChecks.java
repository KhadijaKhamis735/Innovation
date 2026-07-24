package com.example.Innovation_backend.club;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Shared authorization helpers for the club surface. Extracted from
 * {@link ClubProjectService} so multiple services (projects, activities,
 * announcements, ...) can enforce the same privacy pattern without duplication.
 *
 * Privacy rule (matches Phase 5A):
 *   - Cross-university access returns {@link EntityNotFoundException}
 *     (HTTP 404 via the global handler) — NOT 403 — so we don't leak the
 *     existence of branches/projects/activities in sister universities.
 *   - ADMIN bypasses the same-university gate.
 *   - Anonymous callers get 404.
 */
@Component
@RequiredArgsConstructor
public class ClubAccessChecks {

    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;

    /**
     * Throws {@link EntityNotFoundException} when the caller is anonymous or
     * not at the same university as the given club. Admins are exempt.
     */
    public void requireSameUniversityOrAdmin(Club club) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new EntityNotFoundException("Club not found: " + club.getId());
        }
        if (isAdmin(auth)) return;
        Long callerUniId = callerUniversityId(auth);
        if (callerUniId == null || !callerUniId.equals(club.getUniversity().getId())) {
            throw new EntityNotFoundException("Club not found: " + club.getId());
        }
    }

    /**
     * Resolve the caller as a {@link ClubMember} by JWT email, or throw 403.
     * Does NOT enforce status — callers can layer that on top.
     */
    public ClubMember currentMember() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase();
        return memberRepo.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException(
                        "Only club members can perform this action"));
    }

    /**
     * Resolve the caller as a {@link ClubLeader} by JWT email, or throw 403.
     */
    public ClubLeader currentLeader() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase();
        return leaderRepo.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException(
                        "Only club leaders can perform this action"));
    }

    /**
     * Like {@link #currentMember()} but returns an empty Optional instead of
     * throwing — used by callers that want to gracefully detect "the caller is
     * not a club member" (e.g. {@code ProjectService.listMine}).
     */
    public java.util.Optional<ClubMember> currentMemberOpt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return java.util.Optional.empty();
        }
        String email = auth.getName().trim().toLowerCase();
        return memberRepo.findByEmail(email);
    }

    /**
     * Phase 5C-B — for evidence uploads on CLUB-surface projects:
     * passes if (a) admin, (b) caller is the member owner of the project, or
     * (c) caller is a club leader of the same university as the project.
     *
     * Leaders are NOT branch-scoped in MVP (one leader may oversee several
     * branches — see {@link ClubLeader} doc), so "same university" is the
     * correct authorization boundary. Same-university privacy is already
     * enforced by {@link #requireSameUniversityOrAdmin}; this helper layers
     * the owner check on top.
     *
     * Takes primitive ids (rather than the entity itself) so this helper
     * stays in the {@code club} package without a cross-package dependency on
     * {@code project.ProjectEntity}.
     *
     * On any failure, throws {@link EntityNotFoundException} → 404, never 403.
     * The privacy rationale is the same as {@link #requireSameUniversityOrAdmin}:
     * we don't want to confirm the existence of a project to a caller who has
     * no business reading it.
     *
     * For INNOVATION-surface projects, the service layer enforces owner check
     * directly (via {@code User.email}); this helper only applies to CLUB rows.
     */
    public void requireLeaderOfSameUniversityOrOwnerOrAdmin(Long ownerMemberId,
                                                           Long clubUniversityId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new EntityNotFoundException("Project not found");
        }
        if (isAdmin(auth)) return;

        String email = auth.getName().trim().toLowerCase();
        java.util.Optional<ClubMember> me = memberRepo.findByEmail(email);
        if (me.isPresent() && ownerMemberId != null && ownerMemberId.equals(me.get().getId())) {
            return; // owner
        }
        // Not the owner — is the caller a leader of the same university?
        if (clubUniversityId != null) {
            java.util.Optional<ClubLeader> meL = leaderRepo.findByEmail(email);
            if (meL.isPresent() && clubUniversityId.equals(meL.get().getUniversity().getId())) {
                return; // leader of same university
            }
        }
        throw new EntityNotFoundException("Project not found");
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private Long callerUniversityId(Authentication auth) {
        String email = auth.getName().trim().toLowerCase();
        return memberRepo.findByEmail(email)
                .map(m -> m.getClub().getUniversity().getId())
                .or(() -> leaderRepo.findByEmail(email)
                        .map(l -> l.getUniversity().getId()))
                .orElse(null);
    }
}