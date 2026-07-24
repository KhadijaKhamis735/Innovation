package com.example.Innovation_backend.project.attachment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectAttachmentRepository extends JpaRepository<ProjectAttachment, Long> {

    List<ProjectAttachment> findAllByProjectIdOrderByUploadedAtDesc(Long projectId);

    long countByProjectId(Long projectId);

    Optional<ProjectAttachment> findByIdAndProjectId(Long id, Long projectId);
}
