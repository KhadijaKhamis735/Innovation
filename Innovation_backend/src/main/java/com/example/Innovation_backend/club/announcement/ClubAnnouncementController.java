package com.example.Innovation_backend.club.announcement;

import com.example.Innovation_backend.auth.WriteGuard;
import com.example.Innovation_backend.club.announcement.dto.AnnouncementRequest;
import com.example.Innovation_backend.club.announcement.dto.AnnouncementResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Club Announcement endpoints (Phase 5B-2).
 *
 *   POST   /api/club/branches/{id}/announcements         (CLUB_LEADER | ADMIN)  create
 *   GET    /api/club/branches/{id}/announcements         (CLUB_MEMBER | CLUB_LEADER | ADMIN)  list
 *   GET    /api/club/announcements/{id}                  (CLUB_MEMBER | CLUB_LEADER | ADMIN)  get one
 *   PATCH  /api/club/announcements/{id}                  (CLUB_LEADER | ADMIN, author)  update
 *   DELETE /api/club/announcements/{id}                  (CLUB_LEADER | ADMIN, author)  delete
 *
 * Authority beyond {@code @PreAuthorize} is enforced inside
 * {@link ClubAnnouncementService} — same-university access, author-or-admin
 * gating for update/delete.
 *
 * Phase 6B — write methods require verified email via {@link WriteGuard}.
 */
@RestController
@RequiredArgsConstructor
public class ClubAnnouncementController {

    private final ClubAnnouncementService announcementService;
    private final WriteGuard writeGuard;

    @PostMapping("/api/club/branches/{id}/announcements")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementResponse create(
            @PathVariable("id") Long clubId,
            @Valid @RequestBody AnnouncementRequest body) {
        writeGuard.requireVerified();
        return announcementService.create(clubId, body);
    }

    @GetMapping("/api/club/branches/{id}/announcements")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<AnnouncementResponse> listForBranch(@PathVariable("id") Long clubId) {
        return announcementService.listForBranch(clubId);
    }

    @GetMapping("/api/club/announcements/{id}")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public AnnouncementResponse getOne(@PathVariable("id") Long announcementId) {
        return announcementService.getOne(announcementId);
    }

    @PatchMapping("/api/club/announcements/{id}")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    public AnnouncementResponse update(
            @PathVariable("id") Long announcementId,
            @Valid @RequestBody AnnouncementRequest body) {
        writeGuard.requireVerified();
        return announcementService.update(announcementId, body);
    }

    @DeleteMapping("/api/club/announcements/{id}")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long announcementId) {
        writeGuard.requireVerified();
        announcementService.delete(announcementId);
    }
}
