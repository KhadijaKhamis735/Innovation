package com.example.Innovation_backend.user.dto;

import jakarta.validation.constraints.Size;

/**
 * Phase 7 — self-service profile update body. All fields are optional
 * (PATCH semantics): only non-null values are applied. Empty strings
 * are normalised to {@code null} so the persistence layer can treat
 * "the user cleared this field" the same way as "the user never set
 * it" — and so the length constraints don't kick in on blanks the
 * form sent.
 *
 * Bean-validation on top of the column lengths keeps the DB honest
 * even if a malicious client tries to ship a 5 MB bio. Notification
 * booleans are unconditional: the boolean semantics are "the current
 * value" so the absence of a field is treated as "don't change".
 *
 * Email and role are intentionally NOT updatable here — they have
 * dedicated flows (verification, admin promotion).
 */
public record UpdateProfileRequest(
        @Size(max = 80,  message = "firstName must be at most 80 characters")
        String firstName,

        @Size(max = 80,  message = "lastName must be at most 80 characters")
        String lastName,

        @Size(max = 32,  message = "phone must be at most 32 characters")
        String phone,

        @Size(max = 500, message = "bio must be at most 500 characters")
        String bio,

        @Size(max = 160, message = "location must be at most 160 characters")
        String location,

        // Notification preferences — each is its own boolean so the
        // frontend can render independent toggles. `null` means
        // "don't change this preference".
        Boolean emailApplications,
        Boolean emailUpdates,
        Boolean emailReminders,
        Boolean pushApplications,
        Boolean pushUpdates,
        Boolean pushReminders
) {
    /** Empty / whitespace-only strings collapse to {@code null}. */
    private static String blankToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /** Normalise the request — trim strings, blank → null. */
    public UpdateProfileRequest normalized() {
        return new UpdateProfileRequest(
                blankToNull(firstName),
                blankToNull(lastName),
                blankToNull(phone),
                blankToNull(bio),
                blankToNull(location),
                emailApplications,
                emailUpdates,
                emailReminders,
                pushApplications,
                pushUpdates,
                pushReminders
        );
    }
}
