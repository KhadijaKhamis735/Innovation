package com.example.Innovation_backend.user;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * Innovation user (Innovator | Funder | Admin). The first 3 dashboard surfaces
 * of the React frontend map to this entity.
 *
 * Club members/leaders are stored in com.example.Innovation_backend.club.*
 * and use separate tables + auth endpoints.
 */
@Entity
@Table(name = "users",
        uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    /** BCrypt hash. Never exposed via API. */
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 80)
    private String firstName;

    @Column(nullable = false, length = 80)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    /** Required for FUNDER; null for INNOVATOR. Ignored for ADMIN. */
    @Column(length = 80)
    private String sector;

    @Column(nullable = false, length = 20)
    private String status; // "active" | "inactive"

    // Optional profile fields (used by Settings page)
    @Column(length = 32)  private String phone;
    @Column(length = 500) private String bio;
    @Column(length = 160) private String location;
    @Column(length = 500) private String avatarUrl;

    // Notification preferences — flattened booleans (matches Settings.jsx)
    @Column(nullable = false) private boolean emailApplications = true;
    @Column(nullable = false) private boolean emailUpdates = true;
    @Column(nullable = false) private boolean emailReminders = true;
    @Column(nullable = false) private boolean pushApplications = false;
    @Column(nullable = false) private boolean pushUpdates = false;
    @Column(nullable = false) private boolean pushReminders = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;
}
