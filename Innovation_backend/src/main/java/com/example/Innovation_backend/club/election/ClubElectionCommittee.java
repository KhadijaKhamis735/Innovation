package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubLeader;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * An Election Committee for one branch. IBARA YA 32: 3-5 ACTIVE members.
 *
 * Only one committee per branch should be {@code active=true} at any time;
 * the service flips the prior active committee inactive in the same
 * transaction before inserting the new one (see
 * {@code ClubElectionService.formCommittee}).
 *
 * Members are stored as a list of {@code Long} (ClubMember ids) in a
 * separate join table. We deliberately don't use a {@code @ManyToMany} to
 * keep the schema unidirectional and to avoid an inverse collection on
 * ClubMember (per the club-domain convention).
 */
@Entity
@Table(name = "club_election_committees",
        indexes = {
                @Index(name = "idx_committee_club_active",
                       columnList = "club_id, active")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubElectionCommittee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_committee_club"))
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "formed_by",
            foreignKey = @ForeignKey(name = "fk_committee_formed_by"))
    private ClubLeader formedBy;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "club_election_committee_members",
            joinColumns = @JoinColumn(name = "committee_id",
                    foreignKey = @ForeignKey(name = "fk_committee_member")),
            indexes = @Index(name = "idx_committee_member_id", columnList = "member_id"))
    @Column(name = "member_id")
    @Builder.Default
    private List<Long> members = new ArrayList<>();

    @CreatedDate
    @Column(name = "formed_at", nullable = false, updatable = false)
    private Instant formedAt;
}
