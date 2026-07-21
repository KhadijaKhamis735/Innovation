package com.example.Innovation_backend.organization;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

/**
 * Funder organization moderation status:
 * - PENDING  — auto-created on funder register, awaiting admin review
 * - APPROVED — admin approved; funder can now POST opportunities
 * - REJECTED — admin denied; funder cannot post
 *
 * Query-param parsing handled by {@link OrganizationStatusConverter} so
 * {@code ?status=pending} works (case-insensitive).
 */
public enum OrganizationStatus {
    PENDING,
    APPROVED,
    REJECTED;

    @JsonValue
    public String json() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static OrganizationStatus fromJson(String value) {
        return parse(value);
    }

    public static OrganizationStatus parse(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        try {
            return OrganizationStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid status: '" + value + "'. Allowed: pending, approved, rejected");
        }
    }

    @Component
    public static class OrganizationStatusConverter implements Converter<String, OrganizationStatus> {
        @Override
        public OrganizationStatus convert(String source) {
            return parse(source);
        }
    }
}