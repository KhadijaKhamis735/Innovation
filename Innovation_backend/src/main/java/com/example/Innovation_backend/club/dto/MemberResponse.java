package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.MemberCategory;
import com.example.Innovation_backend.club.MembershipStatus;

import java.time.Instant;

/**
 * Public-facing projection of a {@link ClubMember}.
 *
 * Returned by GET /api/club/branches/{id}/members and embedded in
 * ClubAuthResponse. Email is included — this is a directory view, not a
 * public listing — but other sensitive fields (password, etc.) are not.
 */
public record MemberResponse(
        Long id,
        String email,
        String fullName,
        Long universityId,
        String universityShortName,
        MemberCategory category,
        String regNumber,
        String staffId,
        Integer graduationYear,
        String organizationName,
        String organizationRole,
        String bio,
        MembershipStatus status,
        Long clubId,
        String clubName,
        Instant registeredAt,
        Instant verifiedAt,
        String verifiedByName
) {
    public static MemberResponse from(ClubMember m) {
        return new MemberResponse(
                m.getId(),
                m.getEmail(),
                m.getFullName(),
                m.getUniversity().getId(),
                m.getUniversity().getShortName(),
                m.getCategory(),
                m.getRegNumber(),
                m.getStaffId(),
                m.getGraduationYear(),
                m.getOrganizationName(),
                m.getOrganizationRole(),
                m.getBio(),
                m.getStatus(),
                m.getClub().getId(),
                m.getClub().getName(),
                m.getRegisteredAt(),
                m.getVerifiedAt(),
                m.getVerifiedBy() == null ? null : m.getVerifiedBy().getFullName()
        );
    }
}