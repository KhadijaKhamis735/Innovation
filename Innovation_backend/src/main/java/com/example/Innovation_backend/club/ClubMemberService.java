package com.example.Innovation_backend.club;

import com.example.Innovation_backend.club.dto.MemberResponse;
import com.example.Innovation_backend.club.dto.StatusUpdateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Membership-status state machine.
 *
 * Allowed transitions are encoded in {@link MembershipStatus#canTransitionTo}
 * and enforced here. An invalid transition throws IllegalArgumentException,
 * which the GlobalExceptionHandler maps to 400.
 *
 * Authority:
 *   - The acting principal must be a CLUB_LEADER (admin gets a bypass path
 *     handled in the controller via @PreAuthorize).
 *   - The acting leader and the target member must share a club.
 *
 * Verified-by / verified-at are stamped automatically; the request body
 * can't forge them.
 */
@Service
@RequiredArgsConstructor
public class ClubMemberService {

    private final ClubMemberRepository memberRepo;
    private final ClubLeaderRepository leaderRepo;

    @Transactional
    public MemberResponse updateStatus(Long memberId, StatusUpdateRequest req) {
        ClubMember member = memberRepo.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "ClubMember not found: " + memberId));

        MembershipStatus current = member.getStatus();
        MembershipStatus next = req.status();

        if (!current.canTransitionTo(next)) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + current.json() + " → " + next.json()
                            + ". Allowed: " + allowedTransitionsAsString(current));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));

        if (!isAdmin) {
            // Must be a leader AND share a club with the member.
            String leaderEmail = auth == null ? null : auth.getName();
            if (leaderEmail == null) {
                throw new AccessDeniedException("Not authenticated");
            }
            ClubLeader leader = leaderRepo.findByEmail(leaderEmail.trim().toLowerCase())
                    .orElseThrow(() -> new AccessDeniedException(
                            "Only leaders or admins can change member status"));
            if (!leader.getUniversity().getId().equals(member.getUniversity().getId())) {
                throw new AccessDeniedException(
                        "You can only act on members in your own university");
            }
            // Attach verifiedBy + verifiedAt only when activating from pending.
            if (current == MembershipStatus.PENDING && next == MembershipStatus.ACTIVE) {
                member.setVerifiedBy(leader);
                member.setVerifiedAt(Instant.now());
            }
        } else if (current == MembershipStatus.PENDING && next == MembershipStatus.ACTIVE) {
            // Admin doesn't have a row in ClubLeader; leave verifiedBy null but stamp the time.
            member.setVerifiedAt(Instant.now());
        }

        member.setStatus(next);

        // Keep the cached member_count on the club in sync with ACTIVE membership.
        if (next == MembershipStatus.ACTIVE) {
            member.getClub().setMemberCount(
                    member.getClub().getMemberCount() == null ? 1
                            : member.getClub().getMemberCount() + 1);
        } else if (current == MembershipStatus.ACTIVE) {
            member.getClub().setMemberCount(
                    Math.max(0, member.getClub().getMemberCount() - 1));
        }

        return MemberResponse.from(memberRepo.save(member));
    }

    private String allowedTransitionsAsString(MembershipStatus from) {
        return switch (from) {
            case PENDING -> "active, rejected";
            case ACTIVE -> "suspended, withdrawn";
            case SUSPENDED -> "active, expelled";
            default -> "(none — terminal status)";
        };
    }
}