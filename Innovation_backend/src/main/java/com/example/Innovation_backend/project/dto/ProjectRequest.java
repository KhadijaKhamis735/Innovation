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
 *
 * Single shape used by both innovation projects (INNOVATOR) and club projects
 * (CLUB_MEMBER / CLUB_LEADER). The {@code surface} field is NOT a request
 * input — it's derived from the JWT role on the server.
 *
 * Fields used per surface:
 *   - name (required), phase (required), description, category, startDate, milestones — all surfaces
 *   - tagline, tags                                                                — primarily club projects
 *
 * ZSA approval fields ({@code zsaId}, {@code approvalStatus}) are NEVER settable
 * by the client.
 */
public record ProjectRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 240) String tagline,
        @Size(max = 2000) String description,
        @Size(max = 120) String category,
        @NotNull ProjectPhase phase,
        LocalDate startDate,
        @Valid List<MilestoneRequest> milestones,
        @Size(max = 20) List<@Size(max = 60) String> tags
) {}
