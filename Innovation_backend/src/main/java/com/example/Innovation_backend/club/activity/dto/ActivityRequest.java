package com.example.Innovation_backend.club.activity.dto;

import com.example.Innovation_backend.club.activity.ClubActivityStatus;
import com.example.Innovation_backend.club.activity.ClubActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Body for {@code POST /api/club/branches/{id}/activities} and
 * {@code PATCH /api/club/activities/{id}}.
 *
 * {@code startAt >= now} and {@code endAt >= startAt} are enforced in the
 * service layer (cross-field checks can't be expressed in Bean Validation
 * without a custom annotation).
 */
public record ActivityRequest(
        @NotBlank @Size(max = 160) String title,
        @NotNull ClubActivityType type,
        @Size(max = 2000) String description,
        @NotNull Instant startAt,
        @NotNull Instant endAt,
        @Size(max = 200) String location,
        Boolean isOnline,
        @Size(max = 500) String meetingUrl,
        @Positive Integer capacity,
        ClubActivityStatus status
) {}