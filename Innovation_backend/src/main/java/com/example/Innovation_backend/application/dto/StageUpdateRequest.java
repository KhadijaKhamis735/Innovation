package com.example.Innovation_backend.application.dto;

import com.example.Innovation_backend.application.ApplicationStage;
import jakarta.validation.constraints.NotNull;

/**
 * Body for {@code PATCH /api/applications/{id}/stage}.
 *
 * The funder (opportunity owner) or an admin can move an application to any
 * other stage. There's no server-side transition validation in Phase 3C —
 * the plan notes that may tighten to a linear state machine later.
 */
public record StageUpdateRequest(
        @NotNull ApplicationStage stage
) {}