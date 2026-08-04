package com.example.Innovation_backend.project.attachment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Body for {@code POST /api/projects/{id}/attachments/link} — evidence that
 * lives elsewhere (demo video, repository, hosted prototype) rather than being
 * uploaded.
 *
 * Only the shape is validated here; the scheme/host rules live in
 * {@code ProjectAttachmentService.addLink} so that every caller — not just
 * bean-validated controller traffic — goes through the same check.
 */
public record LinkAttachmentRequest(
        @NotBlank(message = "url must not be blank")
        @Size(max = 2048, message = "url must not exceed 2048 characters")
        String url,

        @Size(max = 240) String caption,

        AttachmentKind kind
) {}
