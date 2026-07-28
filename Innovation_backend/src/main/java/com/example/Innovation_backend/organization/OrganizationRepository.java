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

    /**
     * Fallback lookup by the org's stored email. Used by the gating check
     * when the funder_id lookup misses — which can happen if the User row
     * was recreated (e.g. duplicate registration after deletion, seed re-run)
     * and the new User has a different id than the org's funder_id.
     * The email is the only stable identifier across that recreation.
     */
    Optional<Organization> findFirstByEmailIgnoreCase(String email);

    boolean existsByFunderId(Long funderId);
}