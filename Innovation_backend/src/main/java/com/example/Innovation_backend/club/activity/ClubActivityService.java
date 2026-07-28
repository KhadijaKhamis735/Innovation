package com.example.Innovation_backend.club.activity;

import com.example.Innovation_backend.club.activity.dto.ActivityRequest;
import com.example.Innovation_backend.club.activity.dto.ActivityResponse;
import com.example.Innovation_backend.club.activity.dto.RegistrationResponse;
import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubAccessChecks;
import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.ClubMemberRepository;
import com.example.Innovation_backend.club.ClubRepository;
import com.example.Innovation_backend.club.MembershipStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Club activity lifecycle.
 *
 * Authority model:
 *   - Create / update / delete: CLUB_LEADER (must be at the activity's
 *     university) or ADMIN. The organizer is set to the calling leader.
 *   - List / get one: any same-university member, leader, or admin.
 *     Cross-university reads throw {@link EntityNotFoundException}
 *     (privacy pattern from Phase 5A — 404, not 403).
 *   - Register: an ACTIVE member at the same branch. Self-registration only.
 *   - List registrations: leader or admin only.
 *
 * Status transitions are intentionally permissive (single-step). A richer
 * state machine isn't required for MVP.
 */
@Service
@RequiredArgsConstructor
public class ClubActivityService {

    private final ClubActivityRepository activityRepo;
    private final ClubActivityRegistrationRepository regRepo;
    private final ClubRepository clubRepo;
    private final ClubMemberRepository memberRepo;
    private final ClubAccessChecks accessChecks;

    // ── Leader write surface ──────────────────────────────────────────

    @Transactional
    public ActivityResponse create(Long clubId, ActivityRequest req) {
        Club club = requireSameUniversityClub(clubId);
        ClubLeader organizer = accessChecks.currentLeader();

        Instant now = Instant.now();
        if (req.startAt().isBefore(now)) {
            throw new IllegalArgumentException("startAt must be in the future.");
        }
        if (req.endAt().isBefore(req.startAt())) {
            throw new IllegalArgumentException("endAt must be at or after startAt.");
        }
        if (Boolean.TRUE.equals(req.isOnline())
                && (req.meetingUrl() == null || req.meetingUrl().isBlank())) {
            throw new IllegalArgumentException("meetingUrl is required for online activities.");
        }

        ClubActivity activity = ClubActivity.builder()
                .title(req.title().trim())
                .type(req.type())
                .description(trimOrNull(req.description()))
                .startAt(req.startAt())
                .endAt(req.endAt())
                .location(trimOrNull(req.location()))
                .isOnline(Boolean.TRUE.equals(req.isOnline()))
                .meetingUrl(trimOrNull(req.meetingUrl()))
                .capacity(req.capacity())
                .status(req.status() == null ? ClubActivityStatus.SCHEDULED : req.status())
                .club(club)
                .organizer(organizer)
                .build();
        return ActivityResponse.from(activityRepo.save(activity), 0L, false);
    }

    @Transactional
    public ActivityResponse update(Long activityId, ActivityRequest req) {
        ClubActivity activity = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        ClubLeader caller = accessChecks.currentLeader();
        boolean admin = isAdmin();
        if (!activity.getOrganizer().getId().equals(caller.getId()) && !admin) {
            throw new AccessDeniedException(
                    "Only the organizer or an admin can edit this activity");
        }

        if (req.endAt().isBefore(req.startAt())) {
            throw new IllegalArgumentException("endAt must be at or after startAt.");
        }
        if (Boolean.TRUE.equals(req.isOnline())
                && (req.meetingUrl() == null || req.meetingUrl().isBlank())) {
            throw new IllegalArgumentException("meetingUrl is required for online activities.");
        }

        activity.setTitle(req.title().trim());
        activity.setType(req.type());
        activity.setDescription(trimOrNull(req.description()));
        activity.setStartAt(req.startAt());
        activity.setEndAt(req.endAt());
        activity.setLocation(trimOrNull(req.location()));
        activity.setIsOnline(Boolean.TRUE.equals(req.isOnline()));
        activity.setMeetingUrl(trimOrNull(req.meetingUrl()));
        activity.setCapacity(req.capacity());
        if (req.status() != null) activity.setStatus(req.status());

        long count = regRepo.countByActivityId(activity.getId());
        boolean isMe = isCurrentMemberRegistered(activity);
        return ActivityResponse.from(activity, count, isMe);
    }

    @Transactional
    public void delete(Long activityId) {
        ClubActivity activity = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        if (!activity.getOrganizer().getId().equals(accessChecks.currentLeader().getId())
                && !isAdmin()) {
            throw new AccessDeniedException(
                    "Only the organizer or an admin can delete this activity");
        }
        // No FK cascade — delete registrations explicitly first.
        regRepo.findAllByActivityId(activityId)
                .forEach(regRepo::delete);
        activityRepo.delete(activity);
    }

    // ── Member read surface ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ActivityResponse> listForBranch(Long clubId) {
        Club club = requireSameUniversityClub(clubId);
        return activityRepo.findAllByClubIdOrderByStartAtAsc(clubId).stream()
                .map(a -> ActivityResponse.from(
                        a,
                        regRepo.countByActivityId(a.getId()),
                        isCurrentMemberRegistered(a)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getOne(Long activityId) {
        ClubActivity a = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        accessChecks.requireSameUniversityOrAdmin(a.getClub());
        return ActivityResponse.from(
                a,
                regRepo.countByActivityId(a.getId()),
                isCurrentMemberRegistered(a));
    }

    // ── Member registration surface ───────────────────────────────────

    @Transactional
    public RegistrationResponse register(Long activityId) {
        ClubActivity a = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        ClubMember member = accessChecks.currentMember();

        if (member.getStatus() != MembershipStatus.ACTIVE) {
            throw new AccessDeniedException(
                    "Only active club members can register for activities. Your status is "
                            + member.getStatus().json() + ".");
        }
        if (!member.getClub().getId().equals(a.getClub().getId())) {
            throw new AccessDeniedException(
                    "Members can only register for activities at their own branch");
        }
        if (a.getStatus() != ClubActivityStatus.SCHEDULED) {
            throw new IllegalStateException(
                    "This activity is " + a.getStatus().json() + " — registration is closed.");
        }
        if (a.getCapacity() != null
                && regRepo.countByActivityId(activityId) >= a.getCapacity()) {
            throw new IllegalStateException("This activity is full.");
        }
        if (regRepo.existsByActivityIdAndMemberId(activityId, member.getId())) {
            throw new IllegalStateException("You are already registered for this activity.");
        }

        ClubActivityRegistration saved = regRepo.save(
                ClubActivityRegistration.builder()
                        .activity(a)
                        .member(member)
                        .build());
        return RegistrationResponse.from(saved);
    }

    @Transactional
    public void unregister(Long activityId) {
        ClubActivity a = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        ClubMember member = accessChecks.currentMember();
        long deleted = regRepo.deleteByActivityIdAndMemberId(activityId, member.getId());
        if (deleted == 0) {
            throw new EntityNotFoundException("You are not registered for this activity.");
        }
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> listRegistrations(Long activityId) {
        ClubActivity a = activityRepo.findById(activityId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubActivity not found: " + activityId));
        boolean admin = isAdmin();
        ClubLeader caller = accessChecks.currentLeader();
        if (!admin && !a.getOrganizer().getId().equals(caller.getId())) {
            throw new AccessDeniedException(
                    "Only the organizer or an admin can view the registration roster");
        }
        return regRepo.findAllByActivityId(activityId).stream()
                .map(RegistrationResponse::from)
                .toList();
    }

    // ── Internals ─────────────────────────────────────────────────────

    private Club requireSameUniversityClub(Long clubId) {
        Club club = clubRepo.findById(clubId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Club not found: " + clubId));
        accessChecks.requireSameUniversityOrAdmin(club);
        return club;
    }

    /**
     * Returns true if the current caller is an ACTIVE club member who has
     * registered for the given activity. Returns false otherwise (anonymous,
     * leader, or non-member).
     */
    private boolean isCurrentMemberRegistered(ClubActivity a) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) return false;
        boolean isMember = auth.getAuthorities().stream()
                .anyMatch(au -> "ROLE_CLUB_MEMBER".equals(au.getAuthority()));
        if (!isMember) return false;
        String email = auth.getName().trim().toLowerCase();
        return memberRepo.findByEmail(email)
                .map(m -> regRepo.existsByActivityIdAndMemberId(a.getId(), m.getId()))
                .orElse(false);
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(au -> "ROLE_ADMIN".equals(au.getAuthority()));
    }

    private static String trimOrNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}