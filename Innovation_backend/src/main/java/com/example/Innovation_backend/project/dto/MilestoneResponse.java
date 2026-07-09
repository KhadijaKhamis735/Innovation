package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.Milestone;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public projection of a {@link Milestone}. Mirrors the shape of the
 * completedMilestones[] + milestoneDates{} pair used in the frontend mock.
 */
public record MilestoneResponse(
        Long id,
        String name,
        String description,
        boolean completed,
        LocalDate completedDate,
        int position,
        Instant createdAt,
        Instant updatedAt
) {
    public static MilestoneResponse fromEntity(Milestone m) {
        return new MilestoneResponse(
                m.getId(),
                m.getName(),
                m.getDescription(),
                m.isCompleted(),
                m.getCompletedDate(),
                m.getPosition(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}