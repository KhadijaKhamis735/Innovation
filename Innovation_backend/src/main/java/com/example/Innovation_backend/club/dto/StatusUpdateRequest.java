package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.MembershipStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Body for {@code PATCH /api/club/members/{id}/status}.
 *
 * Only the target status is settable. The service layer stamps verifiedBy +
 * verifiedAt automatically based on the calling leader.
 */
public record StatusUpdateRequest(
        @NotNull MembershipStatus status
) {}