package com.example.Innovation_backend.application;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    /** All applications for an opportunity, newest first. Used by the funder
     *  "ReceivedApplications" view. */
    List<Application> findAllByOpportunityIdOrderByAppliedAtDesc(Long opportunityId);

    /** All applications submitted by an innovator, newest first. Used by the
     *  "My Applications" view on the innovator dashboard. */
    List<Application> findAllByInnovatorIdOrderByAppliedAtDesc(Long innovatorId);

    /** Used by ApplicationService.create to enforce the unique constraint
     *  before the DB rejects the insert (and gives a cleaner 409). */
    Optional<Application> findByOpportunityIdAndInnovatorId(Long opportunityId, Long innovatorId);

    /**
     * Phase 6 — every application across every opportunity owned by the
     * given funder, newest first. Drives {@code GET /api/applications/received}.
     *
     * <p>Implemented as a JPQL traversal of the {@code opportunity.funder}
     * association so the funder filter stays server-side (no leakage across
     * funder accounts).
     */
    @Query("""
           SELECT a
             FROM Application a
            WHERE a.opportunity.funder.id = :funderId
            ORDER BY a.appliedAt DESC
           """)
    List<Application> findAllByOpportunityFunderIdOrderByAppliedAtDesc(@Param("funderId") Long funderId);

    /**
     * Phase 6 — admin view: every application in the system, newest first.
     * Same intent as the funder variant but no ownership filter.
     */
    @Query("SELECT a FROM Application a ORDER BY a.appliedAt DESC")
    List<Application> findAllByOrderByAppliedAtDesc();

    /**
     * Phase 9 — funding transparency. For each of the given projects, the
     * ACCEPTED applications that belong to them, so the funder's detail view
     * can show "this project has already received support from X".
     *
     * <p>This is deliberately a batch query keyed on a collection: the
     * Received Applications list can hold many linked applications and a
     * per-row lookup would be an N+1. Callers group the result by
     * {@code projectId} themselves.
     *
     * <p>Returns rows as
     * {@code [projectId, applicationId, funderId, funderDisplayName]}.
     * The funder name is coalesced from the organization name where one
     * exists, falling back to the funder's own name — the same precedence the
     * opportunity DTO uses. {@code funderId} is returned alongside the name
     * because the caller must exclude the VIEWING funder's own awards, and
     * two different funders can legitimately share a display name.
     */
    @Query("""
           SELECT a.project.id,
                  a.id,
                  f.id,
                  COALESCE(o.name, CONCAT(f.firstName, ' ', f.lastName))
             FROM Application a
             JOIN a.opportunity opp
             JOIN opp.funder f
             LEFT JOIN Organization o ON o.funder.id = f.id
            WHERE a.project.id IN :projectIds
              AND a.stage = com.example.Innovation_backend.application.ApplicationStage.ACCEPTED
           """)
    List<Object[]> findAcceptedFundingForProjects(@Param("projectIds") Collection<Long> projectIds);
}