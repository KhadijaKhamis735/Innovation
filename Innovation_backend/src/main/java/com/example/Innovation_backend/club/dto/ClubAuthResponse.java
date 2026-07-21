package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubLeaderRole;
import com.example.Innovation_backend.club.ClubMember;
import com.example.Innovation_backend.club.MemberCategory;
import com.example.Innovation_backend.club.MembershipStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Auth response for the club surface.
 *
 * Exactly one of {@code member} or {@code leader} is populated, depending on
 * which table the principal lives in. {@code role} is the JWT claim value
 * ("club-member" or "club-leader") — matches the frontend's AuthContext.ROLE_HOME.
 *
 * {@code kind} mirrors role but is uppercase for clarity on the frontend.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ClubAuthResponse(
        String token,
        String role,        // "club-member" | "club-leader" (JWT claim)
        String kind,        // "MEMBER" | "LEADER"
        MemberView member,  // null for leaders
        LeaderView leader   // null for members
) {
    public static ClubAuthResponse forMember(String token, ClubMember m) {
        return new ClubAuthResponse(
                token, "club-member", "MEMBER",
                MemberView.from(m), null
        );
    }

    public static ClubAuthResponse forLeader(String token, ClubLeader l) {
        return new ClubAuthResponse(
                token, "club-leader", "LEADER",
                null, LeaderView.from(l)
        );
    }

    public record MemberView(
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
            String clubName
    ) {
        public static MemberView from(ClubMember m) {
            return new MemberView(
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
                    m.getClub().getName()
            );
        }
    }

    public record LeaderView(
            Long id,
            String email,
            String fullName,
            Long universityId,
            String universityShortName,
            ClubLeaderRole role,
            String phone
    ) {
        public static LeaderView from(ClubLeader l) {
            return new LeaderView(
                    l.getId(),
                    l.getEmail(),
                    l.getFullName(),
                    l.getUniversity().getId(),
                    l.getUniversity().getShortName(),
                    l.getRole(),
                    l.getPhone()
            );
        }
    }
}