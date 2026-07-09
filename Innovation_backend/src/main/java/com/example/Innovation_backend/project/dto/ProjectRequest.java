package com.example.Innovation_backend.project.dto;

import com.example.Innovation_backend.project.ProjectPhase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

/**
 * Body for {@code POST /api/projects} and {@code PUT /api/projects/{id}}.
 * Milestones are nested and created/replaced atomically with the project.
 *
 * Note: {@code zsaId} and {@code approvalStatus} are NOT settable by the
 * innovator — those are admin-only fields.
 */
public record ProjectRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 120) String category,
        @NotNull ProjectPhase phase,
        @Size(max = 2000) String description,
        LocalDate startDate,
        @Valid List<MilestoneRequest> milestones
) {}