package com.example.Innovation_backend.opportunity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * The kind of opportunity a funder is posting.
 *
 * Unified vocabulary (matches IMPLEMENTATION_PLAN §7 decision 3):
 *   GRANT, ACCELERATOR, CHALLENGE, FELLOWSHIP,
 *   EQUITY_FUNDING, SEED_FUNDING, PRIZE.
 *
 * Stored in DB as enum constants; serialized lowercase in JSON so the
 * existing React frontend (which uses values like "grant", "accelerator")
 * keeps working without changes. Query-param parsing is handled by
 * {@link OpportunityTypeConverter}.
 */
public enum OpportunityType {
    GRANT,
    ACCELERATOR,
    CHALLENGE,
    FELLOWSHIP,
    EQUITY_FUNDING,
    SEED_FUNDING,
    PRIZE;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OpportunityType fromJson(String value) {
        return parse(value);
    }

    public static OpportunityType parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("type is required");
        }
        try {
            return OpportunityType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid type: '" + value + "'. Allowed: grant, accelerator, challenge, " +
                            "fellowship, equity_funding, seed_funding, prize");
        }
    }
}