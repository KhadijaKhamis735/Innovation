package com.example.Innovation_backend.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<InnovatorProject, Long> {

    /** All projects belonging to a given owner, newest first. */
    List<InnovatorProject> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /** Used by the controller's owner-check before mutating. */
    Optional<InnovatorProject> findByIdAndOwnerId(Long id, Long ownerId);

    /** For admin queue: projects awaiting review. */
    List<InnovatorProject> findAllByApprovalStatusOrderByCreatedAtAsc(ProjectApprovalStatus status);

    /**
     * Counts APPROVED projects whose zsaId starts with the given year prefix,
     * e.g. {@code "ZSA-INV-2026-"} → drives the auto-generated sequence number.
     */
    @Query("SELECT COUNT(p) FROM InnovatorProject p WHERE p.zsaId LIKE CONCAT(:prefix, '%')")
    long countByZsaIdStartingWith(@Param("prefix") String prefix);

    boolean existsByZsaId(String zsaId);
}