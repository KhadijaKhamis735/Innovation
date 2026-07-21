package com.example.Innovation_backend.club;

import jakarta.persistence.*;
import lombok.*;

/**
 * One of 4 Tanzanian universities that host an Innovation Club branch.
 * Seeded once at startup by {@link com.example.Innovation_backend.common.DataSeedRunner}
 * and treated as read-only thereafter.
 *
 * Fields are denormalised into the row rather than a separate config table —
 * they rarely change and need to be returned alongside branches/members.
 */
@Entity
@Table(name = "universities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "short_name", nullable = false, length = 16, unique = true)
    private String shortName;

    /** Prefix used to validate student registration numbers (e.g. "SUZA/2024/001"). */
    @Column(name = "reg_number_prefix", length = 16)
    private String regNumberPrefix;

    /** Brand colour for the frontend (e.g. "#0f766e"). */
    @Column(name = "primary_color", length = 16)
    private String primaryColor;

    @Column(length = 200)
    private String tagline;
}