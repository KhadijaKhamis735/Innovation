package com.example.Innovation_backend.application;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Lifecycle stage of an innovator's application to a funder opportunity.
 *
 * Per IMPLEMENTATION_PLAN §7 (decision 4), the canonical stage vocabulary is:
 *   submitted | under_review | interview | pitch | shortlisted | accepted | rejected
 *
 * Stage transitions are deliberately flexible in Phase 3C — the funder can move
 * an application to any other stage, not just the next one. We may tighten to
 * a linear state machine in a later hardening phase.
 *
 * Stored in DB as enum constants; serialized lowercase in JSON. Query-param
 * parsing handled by {@link ApplicationStageConverter}.
 */
public enum ApplicationStage {
    SUBMITTED,
    UNDER_REVIEW,
    INTERVIEW,
    PITCH,
    SHORTLISTED,
    ACCEPTED,
    REJECTED;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ApplicationStage fromJson(String value) {
        return parse(value);
    }

    public static ApplicationStage parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("stage is required");
        }
        try {
            return ApplicationStage.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid stage: '" + value + "'. Allowed: submitted, under_review, " +
                            "interview, pitch, shortlisted, accepted, rejected");
        }
    }
}