package com.example.Innovation_backend.project.attachment;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Why an attachment exists. Today we only use {@link #EVIDENCE}; the
 * {@link #OTHER} slot is reserved for future kinds (e.g. portfolio, logo)
 * without a schema change.
 */
public enum AttachmentKind {
    EVIDENCE,
    OTHER;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static AttachmentKind fromJson(String value) {
        if (value == null) return EVIDENCE;
        try {
            return AttachmentKind.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid attachment kind: '" + value + "'. Allowed: evidence, other");
        }
    }
}
