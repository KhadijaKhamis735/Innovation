package com.example.Innovation_backend.club.activity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Lifecycle status of a {@link ClubActivity}. Defaults to {@link #SCHEDULED}
 * on create. Leaders can flip to {@link #CANCELLED} (and back) or mark
 * {@link #COMPLETED} once the activity has happened.
 *
 * No state-machine enforcement here — single-step transitions are enough for MVP.
 */
public enum ClubActivityStatus {
    SCHEDULED,
    CANCELLED,
    COMPLETED;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClubActivityStatus fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        try {
            return ClubActivityStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid activity status: '" + value + "'. Allowed: scheduled, cancelled, completed");
        }
    }
}