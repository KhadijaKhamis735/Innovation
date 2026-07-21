package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.BranchResponse;
import com.example.Innovation_backend.club.dto.MemberResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Read-side operations for clubs/branches.
 *
 * Phase 5A follow-up — branches + their projects are now scoped by the
 * caller's university. A SUZA member cannot see branches or projects from
 * ZU / SUMAIT / KIST. Cluster admins (ADMIN role) are exempt.
 *
 * The member directory was already cross-university gated inside listMembers()
 * (a leader at SUZA can't peek at members of a branch at ZU) so its behavior
 * is unchanged.
 */
@Service
@RequiredArgsConstructor
public class ClubBranchService {

    private final ClubRepository clubRepo;
    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;

    /**
     * Directory of members in a branch. Authenticated callers fall into one of
     * three buckets, each with its own access rule:
     *
     *   ADMIN      → can read any branch
     *   CLUB_LEADER → only branches in their own university
     *   CLUB_MEMBER → only their own branch (no peeking at sister branches)
     */
    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(Long clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club not found: " + clubId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            // full read — let it fall through
        } else if (auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLUB_LEADER".equals(a.getAuthority()))) {
            // Leader — must be at the same university as the club.
            ClubLeader caller = leaderRepo.findByEmail(auth.getName().trim().toLowerCase())
                    .orElseThrow(() -> new AccessDeniedException("Leader record not found"));
            if (!caller.getUniversity().getId().equals(club.getUniversity().getId())) {
                throw new AccessDeniedException(
                        "Leaders can only view members of branches at their own university");
            }
        } else if (auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_CLUB_MEMBER".equals(a.getAuthority()))) {
            // Member — must be in the same branch.
            ClubMember caller = memberRepo.findByEmail(auth.getName().trim().toLowerCase())
                    .orElseThrow(() -> new AccessDeniedException("Member record not found"));
            if (!caller.getClub().getId().equals(clubId)) {
                throw new AccessDeniedException(
                        "Members can only view their own branch's directory");
            }
        } else {
            throw new AccessDeniedException("Not a club principal");
        }

        return memberRepo.findAllByClubIdOrderByFullNameAsc(clubId)
                .stream()
                .map(MemberResponse::from)
                .toList();
    }

    /**
     * Resolve the caller as either a ClubMember, a ClubLeader, an ADMIN, or
     * anonymous. Anonymous callers see no branches; cross-university callers
     * also see no branches; admins see the federation.
     */
    private CallerScope resolveCallerScope() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return CallerScope.anonymous();
        }
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return CallerScope.admin();
        }
        String email = auth.getName().trim().toLowerCase();
        var asMember = memberRepo.findByEmail(email);
        if (asMember.isPresent()) {
            return CallerScope.forUniversity(asMember.get().getClub().getUniversity().getId());
        }
        var asLeader = leaderRepo.findByEmail(email);
        if (asLeader.isPresent()) {
            return CallerScope.forUniversity(asLeader.get().getUniversity().getId());
        }
        // Logged in but neither member nor leader — treat as anonymous for these routes.
        return CallerScope.anonymous();
    }

    /** Active branches at the caller's own university only. */
    @Transactional(readOnly = true)
    public List<BranchResponse> listActiveForCaller() {
        CallerScope scope = resolveCallerScope();
        if (scope.kind == CallerScope.Kind.ANONYMOUS) return List.of();
        if (scope.kind == CallerScope.Kind.ADMIN) {
            return clubRepo.findAllByStatusOrderByNameAsc(ClubStatus.ACTIVE)
                    .stream().map(BranchResponse::from).toList();
        }
        Long uniId = scope.universityId;
        return clubRepo.findAllByStatusOrderByNameAsc(ClubStatus.ACTIVE).stream()
                .filter(c -> c.getUniversity().getId().equals(uniId))
                .map(BranchResponse::from)
                .toList();
    }

    /** One branch, but only if it belongs to the caller's university. */
    @Transactional(readOnly = true)
    public BranchResponse getOneForCaller(Long id) {
        Club c = clubRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Club not found: " + id));
        CallerScope scope = resolveCallerScope();
        if (scope.kind != CallerScope.Kind.ADMIN
                && (scope.kind == CallerScope.Kind.ANONYMOUS
                    || !c.getUniversity().getId().equals(scope.universityId))) {
            // 404 (not 403) so we don't leak existence of branches in sister universities.
            throw new EntityNotFoundException("Club not found: " + id);
        }
        return BranchResponse.from(c);
    }

    /** Internal helper for resolveCallerScope(). */
    private static final class CallerScope {
        enum Kind { ANONYMOUS, ADMIN, UNIVERSITY }
        final Kind kind;
        final Long universityId;          // only meaningful when kind == UNIVERSITY
        private CallerScope(Kind k, Long u) { this.kind = k; this.universityId = u; }
        static CallerScope anonymous() { return new CallerScope(Kind.ANONYMOUS, null); }
        static CallerScope admin()     { return new CallerScope(Kind.ADMIN, null); }
        static CallerScope forUniversity(Long id) { return new CallerScope(Kind.UNIVERSITY, id); }
    }

    // ── Compatibility shims — older call sites in the package may still invoke
    //    these names; they delegate to the caller-scoped variants. ──────────
    @Deprecated
    @Transactional(readOnly = true)
    public List<BranchResponse> listActive() {
        return listActiveForCaller();
    }

    @Deprecated
    @Transactional(readOnly = true)
    public BranchResponse getOne(Long id) {
        return getOneForCaller(id);
    }
}