package com.example.Innovation_backend.club.announcement.dto;

import com.example.Innovation_backend.club.announcement.ClubAnnouncement;

import java.time.Instant;

/**
 * Public-facing projection of a {@link ClubAnnouncement}. Same shape the
 * frontend's localStorage announcement object had, plus FK identifiers and
 * timestamps for the React UI.
 */
public record AnnouncementResponse(
        Long id,
        String title,
        String body,
        Boolean pinned,
        Long clubId,
        String clubName,
        Long authorId,
        String authorName,
        Instant createdAt,
        Instant updatedAt
) {
    public static AnnouncementResponse from(ClubAnnouncement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getTitle(),
                a.getBody(),
                a.getPinned(),
                a.getClub().getId(),
                a.getClub().getName(),
                a.getAuthor().getId(),
                a.getAuthor().getFullName(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}