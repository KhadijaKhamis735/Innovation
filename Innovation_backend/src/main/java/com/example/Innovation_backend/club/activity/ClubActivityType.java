package com.example.Innovation_backend.club.activity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type of a {@link ClubActivity}. We model all activity shapes as a single
 * entity (workshops, trainings, pitch practice, demo days, meetings, other)
 * — distinguished only by this field. Frontend uses the lowercase JSON form.
 */
public enum ClubActivityType {
    WORKSHOP,
    TRAINING,
    PITCH_PRACTICE,
    DEMO_DAY,
    MEETING,
    OTHER;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClubActivityType fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("type is required");
        }
        try {
            return ClubActivityType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid activity type: '" + value + "'. Allowed: workshop, training, pitch_practice, demo_day, meeting, other");
        }
    }
}