package com.example.Innovation_backend.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for {@code POST /api/projects/{id}/milestones} and {@code PATCH
 * /api/projects/{id}/milestones/{mid}}. {@code id} and {@code projectId}
 * are path parameters, not body fields.
 */
public record MilestoneRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 1000) String description,
        boolean completed,
        LocalDate completedDate,
        Integer position
) {}