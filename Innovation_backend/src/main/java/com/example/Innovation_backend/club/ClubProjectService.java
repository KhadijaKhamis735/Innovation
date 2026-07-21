package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.ClubProjectRequest;
import com.example.Innovation_backend.club.dto.ClubProjectResponse;
import com.example.Innovation_backend.project.ProjectPhase;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Club project lifecycle.
 *
 * Authority model (mirrors the frontend's ClubContext rules):
 *   - Create: caller must be a CLUB_MEMBER whose status is ACTIVE. A PENDING /
 *     suspended / etc. member gets 403. The project's club is derived from the
 *     member — the client can't choose a branch.
 *   - Read-mine: caller's own projects only.
 *   - Read-by-branch: public (surfaced in the Innovation Hub).
 *   - Delete: author only. Non-owner (or non-existent id) gets 404 so we don't
 *     leak project existence — same convention as InnovatorProject.
 */
@Service
@RequiredArgsConstructor
public class ClubProjectService {

    private final ClubProjectRepository projectRepo;
    private final ClubMemberRepository memberRepo;
    private final ClubRepository clubRepo;
    private final ClubLeaderRepository leaderRepo;

    @Transactional
    public ClubProjectResponse create(ClubProjectRequest req) {
        ClubMember author = currentMember();

        if (author.getStatus() != MembershipStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Only active club members can post projects. Your status is "
                            + author.getStatus().json() + ".");
        }

        List<String> tags = new ArrayList<>();
        if (req.tags() != null) {
            for (String t : req.tags()) {
                if (t != null && !t.isBlank()) tags.add(t.trim());
            }
        }

        ClubProject project = ClubProject.builder()
                .title(req.title().trim())
                .tagline(trimOrNull(req.tagline()))
                .description(trimOrNull(req.description()))
                .category(req.category() == null || req.category().isBlank()
                        ? "General" : req.category().trim())
                .phase(req.phase() == null ? ProjectPhase.IDEA : req.phase())
                .tags(tags)
                .author(author)
                .club(author.getClub())
                .build();

        return ClubProjectResponse.from(projectRepo.save(project));
    }

    @Transactional(readOnly = true)
    public List<ClubProjectResponse> listMine() {
        ClubMember author = currentMember();
        return projectRepo.findAllByAuthorIdOrderByCreatedAtDesc(author.getId())
                .stream().map(ClubProjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ClubProjectResponse> listForBranch(Long clubId) {
        // Phase 5A follow-up — branches + their projects are scoped by the
        // caller's own university. Same access rule as ClubBranchService.
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException("Club not found: " + clubId));
        requireSameUniversityOrAdmin(club);
        return projectRepo.findAllByClubIdOrderByCreatedAtDesc(clubId)
                .stream().map(ClubProjectResponse::from).toList();
    }

    /**
     * Throws EntityNotFoundException when the caller is anonymous or their
     * token doesn't resolve to a member/leader of the same university. Admins
     * are exempt. 404 (not 403) on cross-university calls so we don't leak
     * existence of projects in sister branches.
     */
    private void requireSameUniversityOrAdmin(Club club) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            throw new EntityNotFoundException("Club not found: " + club.getId());
        }
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) return;
        String email = auth.getName().trim().toLowerCase();
        Long callerUniId = memberRepo.findByEmail(email)
                .map(m -> m.getClub().getUniversity().getId())
                .or(() -> leaderRepo.findByEmail(email)
                        .map(l -> l.getUniversity().getId()))
                .orElse(null);
        if (callerUniId == null || !callerUniId.equals(club.getUniversity().getId())) {
            throw new EntityNotFoundException("Club not found: " + club.getId());
        }
    }

    @Transactional
    public void delete(Long projectId) {
        ClubMember author = currentMember();
        ClubProject project = projectRepo.findById(projectId)
                .filter(p -> p.getAuthor().getId().equals(author.getId()))
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubProject not found: " + projectId));
        projectRepo.delete(project);
    }

    // ── Internals ─────────────────────────────────────────────────────

    /** Resolve the authenticated club member from the JWT, or 403. */
    private ClubMember currentMember() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new AccessDeniedException("Not authenticated");
        }
        String email = auth.getName().trim().toLowerCase();
        return memberRepo.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException(
                        "Only club members can manage club projects"));
    }

    private static String trimOrNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
