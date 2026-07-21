package com.example.Innovation_backend.opportunity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Lifecycle status of a posted opportunity:
 *   OPEN   — visible to the public, accepting applications
 *   CLOSED — past deadline or manually closed by the funder
 *   DRAFT  — not yet published (Phase 3B defaults to OPEN on POST; DRAFT
 *            is reserved for a future "save as draft" UI)
 *
 * Stored in DB as enum constants; serialized lowercase in JSON.
 * Query-param parsing handled by {@link OpportunityStatusConverter}.
 */
public enum OpportunityStatus {
    OPEN,
    CLOSED,
    DRAFT;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OpportunityStatus fromJson(String value) {
        return parse(value);
    }

    public static OpportunityStatus parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        try {
            return OpportunityStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + value + "'. Allowed: open, closed, draft");
        }
    }
}