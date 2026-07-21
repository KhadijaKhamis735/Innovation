package com.example.Innovation_backend.club.dto;

import com.example.Innovation_backend.club.ClubProject;
import com.example.Innovation_backend.project.ProjectPhase;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Public-facing projection of a {@link ClubProject}. Shaped to match the
 * frontend's localStorage clubProject object (title/category/phase/authorName/
 * universityShortName/createdAt) so the React pages need no reshaping.
 */
public record ClubProjectResponse(
        Long id,
        String title,
        String tagline,
        String description,
        String category,
        ProjectPhase phase,
        List<String> tags,
        Long authorId,
        String authorName,
        Long clubId,
        String clubName,
        Long universityId,
        String universityShortName,
        Instant createdAt
) {
    public static ClubProjectResponse from(ClubProject p) {
        return new ClubProjectResponse(
                p.getId(),
                p.getTitle(),
                p.getTagline(),
                p.getDescription(),
                p.getCategory(),
                p.getPhase(),
                p.getTags() == null ? new ArrayList<>() : new ArrayList<>(p.getTags()),
                p.getAuthor().getId(),
                p.getAuthor().getFullName(),
                p.getClub().getId(),
                p.getClub().getName(),
                p.getClub().getUniversity().getId(),
                p.getClub().getUniversity().getShortName(),
                p.getCreatedAt()
        );
    }
}
