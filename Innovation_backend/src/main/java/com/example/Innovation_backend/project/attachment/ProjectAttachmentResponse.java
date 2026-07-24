package com.example.Innovation_backend.project.attachment;

import java.time.Instant;

/**
 * Metadata projection of an attachment. Bytes are streamed on
 * {@code GET /api/projects/{id}/attachments/{attId}} — this DTO never carries
 * content.
 */
public record ProjectAttachmentResponse(
        Long id,
        Long projectId,
        String originalFilename,
        String mimeType,
        long sizeBytes,
        AttachmentKind kind,
        String caption,
        Long uploadedByUserId,
        Long uploadedByMemberId,
        String uploadedByName,
        Instant uploadedAt
) {
    public static ProjectAttachmentResponse fromEntity(ProjectAttachment a) {
        Long uploadedByUserId = a.getUploadedByUser() == null ? null : a.getUploadedByUser().getId();
        Long uploadedByMemberId = a.getUploadedByMember() == null ? null : a.getUploadedByMember().getId();
        String uploadedByName;
        if (a.getUploadedByUser() != null) {
            String fn = a.getUploadedByUser().getFirstName() != null ? a.getUploadedByUser().getFirstName() : "";
            String ln = a.getUploadedByUser().getLastName() != null ? a.getUploadedByUser().getLastName() : "";
            uploadedByName = (fn + " " + ln).trim();
            if (uploadedByName.isEmpty()) {
                uploadedByName = a.getUploadedByUser().getEmail();
            }
        } else if (a.getUploadedByMember() != null) {
            uploadedByName = a.getUploadedByMember().getFullName();
        } else {
            uploadedByName = "(unknown)";
        }
        return new ProjectAttachmentResponse(
                a.getId(),
                a.getProject().getId(),
                a.getOriginalFilename(),
                a.getMimeType(),
                a.getSizeBytes(),
                a.getKind(),
                a.getCaption(),
                uploadedByUserId,
                uploadedByMemberId,
                uploadedByName,
                a.getUploadedAt()
        );
    }
}
