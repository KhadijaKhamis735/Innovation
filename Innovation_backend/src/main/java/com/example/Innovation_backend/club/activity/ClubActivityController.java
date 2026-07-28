package com.example.Innovation_backend.club.activity;

import com.example.Innovation_backend.auth.WriteGuard;
import com.example.Innovation_backend.club.activity.dto.ActivityRequest;
import com.example.Innovation_backend.club.activity.dto.ActivityResponse;
import com.example.Innovation_backend.club.activity.dto.RegistrationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Club Activity endpoints (Phase 5B-2).
 *
 *   POST   /api/club/branches/{id}/activities           (CLUB_LEADER | ADMIN)  create
 *   GET    /api/club/branches/{id}/activities           (CLUB_MEMBER | CLUB_LEADER | ADMIN)  list
 *   GET    /api/club/activities/{id}                     (CLUB_MEMBER | CLUB_LEADER | ADMIN)  get one
 *   PATCH  /api/club/activities/{id}                     (CLUB_LEADER | ADMIN, organizer)  update
 *   DELETE /api/club/activities/{id}                     (CLUB_LEADER | ADMIN, organizer)  delete
 *   POST   /api/club/activities/{id}/register            (CLUB_MEMBER, ACTIVE)  register self
 *   DELETE /api/club/activities/{id}/register            (CLUB_MEMBER, ACTIVE)  unregister self
 *   GET    /api/club/activities/{id}/registrations       (CLUB_LEADER | ADMIN, organizer)  roster
 *
 * Authority beyond {@code @PreAuthorize} is enforced inside
 * {@link ClubActivityService} — same-university access, ACTIVE-status gating
 * for registration, organizer-or-admin gating for update/delete/roster.
 *
 * Phase 6B — write methods additionally require verified email via
 * {@link WriteGuard#requireVerified()}.
 */
@RestController
@RequiredArgsConstructor
public class ClubActivityController {

    private final ClubActivityService activityService;
    private final WriteGuard writeGuard;

    @PostMapping("/api/club/branches/{id}/activities")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityResponse create(
            @PathVariable("id") Long clubId,
            @Valid @RequestBody ActivityRequest body) {
        writeGuard.requireVerified();
        return activityService.create(clubId, body);
    }

    @GetMapping("/api/club/branches/{id}/activities")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public List<ActivityResponse> listForBranch(@PathVariable("id") Long clubId) {
        return activityService.listForBranch(clubId);
    }

    @GetMapping("/api/club/activities/{id}")
    @PreAuthorize("hasAnyRole('CLUB_MEMBER','CLUB_LEADER','ADMIN')")
    public ActivityResponse getOne(@PathVariable("id") Long activityId) {
        return activityService.getOne(activityId);
    }

    @PatchMapping("/api/club/activities/{id}")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    public ActivityResponse update(
            @PathVariable("id") Long activityId,
            @Valid @RequestBody ActivityRequest body) {
        writeGuard.requireVerified();
        return activityService.update(activityId, body);
    }

    @DeleteMapping("/api/club/activities/{id}")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long activityId) {
        writeGuard.requireVerified();
        activityService.delete(activityId);
    }

    @PostMapping("/api/club/activities/{id}/register")
    @PreAuthorize("hasRole('CLUB_MEMBER')")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(@PathVariable("id") Long activityId) {
        writeGuard.requireVerified();
        return activityService.register(activityId);
    }

    @DeleteMapping("/api/club/activities/{id}/register")
    @PreAuthorize("hasRole('CLUB_MEMBER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@PathVariable("id") Long activityId) {
        writeGuard.requireVerified();
        activityService.unregister(activityId);
    }

    @GetMapping("/api/club/activities/{id}/registrations")
    @PreAuthorize("hasAnyRole('CLUB_LEADER','ADMIN')")
    public List<RegistrationResponse> listRegistrations(@PathVariable("id") Long activityId) {
        return activityService.listRegistrations(activityId);
    }
}