package com.example.Innovation_backend.club.activity;

import com.example.Innovation_backend.club.Club;
import com.example.Innovation_backend.club.ClubLeader;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A club activity — workshop, training, pitch practice, demo day, meeting, or
 * other event posted by a Club Leader for the members of their branch.
 *
 * Mirrors the model the frontend used to keep in localStorage (id, title,
 * type, description, start/end, location, online, meetingUrl, capacity,
 * status, organizer, club) but with the activity lives server-side, scoped
 * by university.
 */
@Entity
@Table(name = "club_activities",
        indexes = {
                @Index(name = "idx_activity_club", columnList = "club_id"),
                @Index(name = "idx_activity_organizer", columnList = "organizer_id"),
                @Index(name = "idx_activity_start", columnList = "start_at"),
                @Index(name = "idx_activity_status", columnList = "status")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ClubActivityType type;

    @Column(length = 2000)
    private String description;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(length = 200)
    private String location;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "meeting_url", length = 500)
    private String meetingUrl;

    /** Null means unlimited. */
    @Column
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ClubActivityStatus status = ClubActivityStatus.SCHEDULED;

    /** The branch this activity belongs to. Required. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_activity_club"))
    private Club club;

    /** The leader who created it. Required — drives "edit/delete" authorization. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organizer_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_activity_organizer"))
    private ClubLeader organizer;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}