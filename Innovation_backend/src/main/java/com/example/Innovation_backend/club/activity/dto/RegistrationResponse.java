package com.example.Innovation_backend.club.activity.dto;

import com.example.Innovation_backend.club.activity.ClubActivityRegistration;

import java.time.Instant;

/**
 * Returned from {@code POST /api/club/activities/{id}/register} so the
 * frontend can show a confirmation toast and update the activity card
 * without a fresh GET.
 */
public record RegistrationResponse(
        Long activityId,
        Long memberId,
        String memberName,
        Instant registeredAt
) {
    public static RegistrationResponse from(ClubActivityRegistration r) {
        return new RegistrationResponse(
                r.getActivity().getId(),
                r.getMember().getId(),
                r.getMember().getFullName(),
                r.getRegisteredAt()
        );
    }
}