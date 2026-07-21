package com.example.Innovation_backend.club;

import com.example.Innovation_backend.project.ProjectPhase;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A project posted by an active club member. Bridges the Club surface into
 * the Innovation Hub — mirrors the localStorage "clubProjects" shape from the
 * React frontend's ClubContext.createClubProject.
 *
 * Only ACTIVE {@link ClubMember}s can create one (enforced in
 * {@link ClubProjectService}). Reuses the Innovation-surface {@link ProjectPhase}
 * enum (idea → proposal → prototype → mvp → scaling) so the phase vocabulary is
 * shared with innovator projects and the frontend's PHASES list.
 */
@Entity
@Table(name = "club_projects",
        indexes = {
                @Index(name = "idx_club_project_author", columnList = "author_id"),
                @Index(name = "idx_club_project_club", columnList = "club_id"),
                @Index(name = "idx_club_project_phase", columnList = "phase")
        })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClubProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    /** One-sentence summary shown on cards. */
    @Column(length = 240)
    private String tagline;

    @Column(length = 2000)
    private String description;

    @Column(length = 120)
    @Builder.Default
    private String category = "General";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProjectPhase phase = ProjectPhase.IDEA;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "club_project_tags",
            joinColumns = @JoinColumn(name = "project_id",
                    foreignKey = @ForeignKey(name = "fk_club_project_tag")))
    @Column(name = "tag", length = 60)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    /** The club member who posted this. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_club_project_author"))
    private ClubMember author;

    /** The branch the project belongs to (derived from the author's club). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_club_project_club"))
    private Club club;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
