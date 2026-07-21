package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A candidacy in an election. One row per (election, candidate). The DB
 * enforces "one candidacy per person per election" via the unique constraint
 * on {@code (election_id, candidate_id)}.
 *
 * Seconders are a separate {@link ElementCollection} — IBARA YA 32 requires
 * at least one seconder, but the frontend currently allows zero; minimum is
 * enforced only as a soft recommendation (see plan §12.7 — known deviation).
 */
@Entity
@Table(name = "club_nominations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_nomination_election_candidate",
                                  columnNames = {"election_id", "candidate_id"})
        },
        indexes = {
                @Index(name = "idx_nomination_election", columnList = "election_id"),
                @Index(name = "idx_nomination_candidate", columnList = "candidate_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubNomination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_nomination_election"))
    private ClubElection election;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_nomination_candidate"))
    private ClubMember candidate;

    @Column(nullable = false, length = 2000)
    private String statement;

    @Column(length = 2000)
    private String experience;

    @Column(name = "hours_per_week", nullable = false)
    @Builder.Default
    private Integer hoursPerWeek = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "club_nomination_seconders",
            joinColumns = @JoinColumn(name = "nomination_id",
                    foreignKey = @ForeignKey(name = "fk_nomination_seconder_nom")),
            indexes = @Index(name = "idx_seconder_member", columnList = "member_id"))
    @Column(name = "member_id")
    @Builder.Default
    private List<Long> seconders = new ArrayList<>();

    @CreatedDate
    @Column(name = "nominated_at", nullable = false, updatable = false)
    private Instant nominatedAt;
}
