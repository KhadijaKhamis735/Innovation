package com.example.Innovation_backend.club;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Map;
import java.util.Set;

/**
 * Membership lifecycle for a {@link ClubMember}. Per IMPLEMENTATION_PLAN §3.2
 * there are 6 values. We model the full state machine in
 * {@link ClubMemberService#updateStatus} — invalid transitions return 400.
 *
 *   pending    → active | rejected
 *   active     → suspended | withdrawn
 *   suspended  → active | expelled
 *   withdrawn  → (terminal)
 *   rejected   → (terminal)
 *   expelled   → (terminal)
 */
public enum MembershipStatus {
    PENDING,
    ACTIVE,
    SUSPENDED,
    EXPELLED,
    WITHDRAWN,
    REJECTED;

    /**
     * Allowed forward transitions from each status.
     * Leader-initiated; the system never moves members unilaterally.
     */
    private static final Map<MembershipStatus, Set<MembershipStatus>> ALLOWED = Map.of(
            PENDING,   Set.of(ACTIVE, REJECTED),
            ACTIVE,    Set.of(SUSPENDED, WITHDRAWN),
            SUSPENDED, Set.of(ACTIVE, EXPELLED),
            WITHDRAWN, Set.of(),
            REJECTED,  Set.of(),
            EXPELLED,  Set.of()
    );

    public boolean canTransitionTo(MembershipStatus next) {
        return ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static MembershipStatus fromJson(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        try {
            return MembershipStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + value + "'. Allowed: pending, active, suspended, expelled, withdrawn, rejected");
        }
    }
}