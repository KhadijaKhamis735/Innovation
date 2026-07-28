package com.example.Innovation_backend.club.announcement;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubLeader;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A pinned-or-not notice from a club leader to the members of their branch.
 * Used for club-wide announcements ("term opens Friday", "hackathon venue
 * changed", "scholarship call open"). Mirrors the previous localStorage
 * announcement shape but with proper auth + university-scope.
 */
@Entity
@Table(name = "club_announcements",
        indexes = {
                @Index(name = "idx_ann_club", columnList = "club_id"),
                @Index(name = "idx_ann_author", columnList = "author_id"),
                @Index(name = "idx_ann_pinned", columnList = "pinned")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 4000)
    private String body;

    /** Pinned announcements float to the top of the feed regardless of created_at. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean pinned = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ann_club"))
    private Club club;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ann_author"))
    private ClubLeader author;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}