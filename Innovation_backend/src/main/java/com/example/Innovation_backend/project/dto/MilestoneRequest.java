package com.example.Innovation_backend.project.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Body for {@code POST /api/projects/{id}/milestones} and {@code PATCH
 * /api/projects/{id}/milestones/{mid}}. {@code id} and {@code projectId}
 * are path parameters, not body fields.
 *
 * `name` is nullable on PATCH — partial updates should not require the
 * client to re-send the existing name. POST enforces a non-blank name
 * via an explicit check in {@code MilestoneService.add}.
 */
public record MilestoneRequest(
        @Size(max = 200) String name,
        @Size(max = 1000) String description,
        boolean completed,
        LocalDate completedDate,
        Integer position
) {}