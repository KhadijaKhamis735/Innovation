package com.example.Innovation_backend.club.election;

import com.example.Innovation_backend.club.ClubLeader;
import com.example.Innovation_backend.club.ClubMember;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A complaint filed against an election. ACTIVE branch members can file;
 * Patron/Chair/Committee can resolve. Reads are transparent: every complaint
 * (resolved or not) is returned; the UI filters.
 */
@Entity
@Table(name = "club_election_complaints",
        indexes = {
                @Index(name = "idx_complaint_election", columnList = "election_id")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubElectionComplaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "election_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_complaint_election"))
    private ClubElection election;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "complainant_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_complaint_complainant"))
    private ClubMember complainant;

    @Column(nullable = false, length = 4000)
    private String text;

    @CreatedDate
    @Column(name = "filed_at", nullable = false, updatable = false)
    private Instant filedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resolved = false;

    @Column(length = 2000)
    private String resolution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by",
            foreignKey = @ForeignKey(name = "fk_complaint_resolved_by"))
    private ClubLeader resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
