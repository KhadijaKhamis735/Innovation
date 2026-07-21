package com.example.Innovation_backend.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {

    /** List orgs by status (admin queue). */
    List<Organization> findAllByStatusOrderBySubmittedDateAsc(OrganizationStatus status);

    /** Used by the gating check on POST /api/opportunities. */
    Optional<Organization> findFirstByFunderIdAndStatus(Long funderId, OrganizationStatus status);

    /** Used by the auto-create on funder register (unique-per-funder). */
    Optional<Organization> findByFunderId(Long funderId);

    boolean existsByFunderId(Long funderId);
}