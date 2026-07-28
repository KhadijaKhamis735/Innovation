package com.example.Innovation_backend.club.announcement;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubRepository;
import com.example.Innovation_backend.club.announcement.dto.AnnouncementRequest;
import com.example.Innovation_backend.club.announcement.dto.AnnouncementResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Club announcement lifecycle.
 *
 * Authority model (mirrors Phase 5A & the activities pattern):
 *   - Create / update / delete: CLUB_LEADER (at the announcement's university)
 *     or ADMIN. The author is the caller.
 *   - List / get one: any same-university member, leader, or admin. Cross-uni
 *     reads throw 404 (privacy pattern).
 *
 * No soft-delete or scheduled publishing in MVP — single-step transitions.
 */
@Service
@RequiredArgsConstructor
public class ClubAnnouncementService {

    private final ClubAnnouncementRepository announcementRepo;
    private final ClubRepository clubRepo;
    private final ClubAccessChecks accessChecks;

    @Transactional
    public AnnouncementResponse create(Long clubId, AnnouncementRequest req) {
        Club club = requireSameUniversityClub(clubId);
        ClubLeader author = accessChecks.currentLeader();

        ClubAnnouncement a = ClubAnnouncement.builder()
                .title(req.title().trim())
                .body(req.body().trim())
                .pinned(Boolean.TRUE.equals(req.pinned()))
                .club(club)
                .author(author)
                .build();
        return AnnouncementResponse.from(announcementRepo.save(a));
    }

    @Transactional
    public AnnouncementResponse update(Long announcementId, AnnouncementRequest req) {
        ClubAnnouncement a = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubAnnouncement not found: " + announcementId));
        ClubLeader caller = accessChecks.currentLeader();
        if (!a.getAuthor().getId().equals(caller.getId()) && !isAdmin()) {
            throw new AccessDeniedException(
                    "Only the author or an admin can edit this announcement");
        }
        a.setTitle(req.title().trim());
        a.setBody(req.body().trim());
        a.setPinned(Boolean.TRUE.equals(req.pinned()));
        return AnnouncementResponse.from(a);
    }

    @Transactional
    public void delete(Long announcementId) {
        ClubAnnouncement a = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubAnnouncement not found: " + announcementId));
        if (!a.getAuthor().getId().equals(accessChecks.currentLeader().getId())
                && !isAdmin()) {
            throw new AccessDeniedException(
                    "Only the author or an admin can delete this announcement");
        }
        announcementRepo.delete(a);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> listForBranch(Long clubId) {
        requireSameUniversityClub(clubId);
        return announcementRepo
                .findAllByClubIdOrderByPinnedDescCreatedAtDesc(clubId)
                .stream().map(AnnouncementResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AnnouncementResponse getOne(Long announcementId) {
        ClubAnnouncement a = announcementRepo.findById(announcementId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubAnnouncement not found: " + announcementId));
        accessChecks.requireSameUniversityOrAdmin(a.getClub());
        return AnnouncementResponse.from(a);
    }

    // ── Internals ─────────────────────────────────────────────────────

    private Club requireSameUniversityClub(Long clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Club not found: " + clubId));
        accessChecks.requireSameUniversityOrAdmin(club);
        return club;
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(au -> "ROLE_ADMIN".equals(au.getAuthority()));
    }
}