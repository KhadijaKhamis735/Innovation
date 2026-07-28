package com.example.Innovation_backend.club.announcement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body for {@code POST /api/club/branches/{id}/announcements} and
 * {@code PATCH /api/club/announcements/{id}}.
 */
public record AnnouncementRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 4000) String body,
        Boolean pinned
) {}