package com.example.Innovation_backend.project.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectAttachmentRepository extends JpaRepository<ProjectAttachment, Long> {

    List<ProjectAttachment> findAllByProjectIdOrderByUploadedAtDesc(Long projectId);

    long countByProjectId(Long projectId);

    /**
     * Backs the evidence-required gate on {@code PATCH /api/projects/{id}/phase}
     * — counts both uploaded files and links of the given kind.
     */
    long countByProjectIdAndKind(Long projectId, AttachmentKind kind);

    Optional<ProjectAttachment> findByIdAndProjectId(Long id, Long projectId);
}
