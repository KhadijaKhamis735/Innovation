package com.example.Innovation_backend.club.election;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Lifecycle of an election (IBARA YA 30, 32). Five values; transitions are
 * enforced both by the service and by {@link #canTransitionTo}.
 *
 *   nominations_open → campaign | cancelled
 *   campaign         → voting | cancelled
 *   voting           → closed | cancelled | voting   (self-edge for /reopen setting new votingEndAt)
 *   closed           → (terminal)
 *   cancelled        → (terminal)
 *
 * JSON values are lowercase (e.g. "nominations_open") to match the rest of
 * the club enums.
 */
public enum ClubElectionStatus {
    NOMINATIONS_OPEN,
    CAMPAIGN,
    VOTING,
    CLOSED,
    CANCELLED;

    private static final Map<ClubElectionStatus, Set<ClubElectionStatus>> ALLOWED = Map.of(
            NOMINATIONS_OPEN, EnumSet.of(CAMPAIGN, CANCELLED),
            CAMPAIGN,         EnumSet.of(VOTING, CANCELLED),
            // The self-edge on VOTING supports reopenForRunoff — status stays VOTING while votingEndAt is updated.
            VOTING,           EnumSet.of(CLOSED, CANCELLED, VOTING),
            CLOSED,           EnumSet.noneOf(ClubElectionStatus.class),
            CANCELLED,        EnumSet.noneOf(ClubElectionStatus.class)
    );

    public boolean canTransitionTo(ClubElectionStatus next) {
        return next != null && ALLOWED.getOrDefault(this, EnumSet.noneOf(ClubElectionStatus.class)).contains(next);
    }

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ClubElectionStatus fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        try {
            return ClubElectionStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid election status: '" + value + "'. Allowed: nominations_open, campaign, voting, closed, cancelled");
        }
    }
}
