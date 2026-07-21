package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubStatus;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Public-facing projection of a {@link Club} branch.
 *
 * Returned by GET /api/club/branches and GET /api/club/branches/{id}.
 * The {@code patron} block is null for branches without a patron.
 */
public record BranchResponse(
        Long id,
        String name,
        Long universityId,
        String universityShortName,
        String universityName,
        String campus,
        String address,
        LocalDate foundedAt,
        LocalDate charterSignedAt,
        ClubStatus status,
        Integer memberCount,
        PatronView patron,
        Instant createdAt,
        Instant updatedAt
) {
    public static BranchResponse from(Club c) {
        return new BranchResponse(
                c.getId(),
                c.getName(),
                c.getUniversity().getId(),
                c.getUniversity().getShortName(),
                c.getUniversity().getName(),
                c.getCampus(),
                c.getAddress(),
                c.getFoundedAt(),
                c.getCharterSignedAt(),
                c.getStatus(),
                c.getMemberCount(),
                c.getPatron() == null ? null : PatronView.from(c.getPatron()),
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    public record PatronView(Long id, String fullName, String email) {
        public static PatronView from(com.example.Innovation_backend.club.ClubLeader p) {
            return new PatronView(p.getId(), p.getFullName(), p.getEmail());
        }
    }
}