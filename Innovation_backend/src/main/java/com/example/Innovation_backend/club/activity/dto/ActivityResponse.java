package com.example.Innovation_backend.club.activity.dto;

import com.example.Innovation_backend.club.activity.ClubActivity;
import com.example.Innovation_backend.club.activity.ClubActivityStatus;
import com.example.Innovation_backend.club.activity.ClubActivityType;

import java.time.Instant;

/**
 * Public-facing projection of a {@link ClubActivity}. Shaped to match the
 * frontend's existing localStorage activity object (title/type/start/end/
 * location/online/url/capacity/status) plus a {@code registrationCount} and
 * an {@code isCurrentUserRegistered} flag so the React UI can render the
 * Register/Registered button without a second round-trip.
 */
public record ActivityResponse(
        Long id,
        String title,
        ClubActivityType type,
        String description,
        Instant startAt,
        Instant endAt,
        String location,
        Boolean isOnline,
        String meetingUrl,
        Integer capacity,
        ClubActivityStatus status,
        Long clubId,
        String clubName,
        Long organizerId,
        String organizerName,
        long registrationCount,
        boolean isCurrentUserRegistered,
        Instant createdAt
) {
    public static ActivityResponse from(
            ClubActivity a,
            long registrationCount,
            boolean isCurrentUserRegistered) {
        return new ActivityResponse(
                a.getId(),
                a.getTitle(),
                a.getType(),
                a.getDescription(),
                a.getStartAt(),
                a.getEndAt(),
                a.getLocation(),
                a.getIsOnline(),
                a.getMeetingUrl(),
                a.getCapacity(),
                a.getStatus(),
                a.getClub().getId(),
                a.getClub().getName(),
                a.getOrganizer().getId(),
                a.getOrganizer().getFullName(),
                registrationCount,
                isCurrentUserRegistered,
                a.getCreatedAt()
        );
    }
}