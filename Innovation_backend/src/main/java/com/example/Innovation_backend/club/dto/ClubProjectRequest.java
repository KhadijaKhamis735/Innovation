package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.project.ProjectPhase;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Body for {@code POST /api/club/projects}.
 *
 * {@code phase} is optional — defaults to {@code idea} when omitted. Parsed via
 * ProjectPhase's @JsonCreator so it accepts lowercase strings from the frontend
 * (idea/proposal/prototype/mvp/scaling).
 */
public record ClubProjectRequest(
        @NotBlank @Size(max = 160) String title,
        @Size(max = 240) String tagline,
        @Size(max = 2000) String description,
        @Size(max = 120) String category,
        ProjectPhase phase,
        List<@Size(max = 60) String> tags
) {}
