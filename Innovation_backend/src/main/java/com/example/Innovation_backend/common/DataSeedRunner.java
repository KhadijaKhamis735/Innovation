package com.example.Innovation_backend.common;

import com.example.Innovation_backend.club.*;
import com.example.Innovation_backend.organization.Organization;
import com.example.Innovation_backend.organization.OrganizationRepository;
import com.example.Innovation_backend.organization.OrganizationStatus;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time seeding on first startup. Idempotent — checks for existing rows
 * before inserting.
 *
 * Seeds (in order):
 *   1. Default admin user (admin@innovation.local / Admin123!)
 *   2. Two test funders for Phase 3B gating proof:
 *        - funder3@test.com — APPROVED org (can post opportunities)
 *        - funder4@test.com — PENDING org (gating should block them)
 *   3. Phase 4 — Club surface:
 *        - 4 universities (SUZA, KIST, SUMAIT, ZU) — read-only after seeding
 *      NO club leaders, NO branches — the admin creates these via
 *      POST /api/club/branches and POST /api/admin/club-leaders.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeedRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final UniversityRepository universityRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@innovation.local";
    private static final String ADMIN_PASSWORD = "Admin123!";

    private static final String FUNDER3_EMAIL = "funder3@test.com";
    private static final String FUNDER4_EMAIL = "funder4@test.com";
    private static final String TEST_PASSWORD = "Password1!";

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedApprovedFunder();
        seedPendingFunder();
        seedUniversities();
    }

    // ── Innovation surface ────────────────────────────────────────────

    private void seedAdmin() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            log.info("DataSeedRunner: admin user already exists, skipping.");
            return;
        }

        User admin = User.builder()
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .firstName("System")
                .lastName("Admin")
                .role(Role.ADMIN)
                .status("active")
                .emailApplications(true)
                .emailUpdates(true)
                .emailReminders(true)
                .build();

        userRepository.save(admin);
        log.warn("DataSeedRunner: created default admin user '{}' (password: '{}'). " +
                "Change this in production!", ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private void seedApprovedFunder() {
        if (userRepository.existsByEmail(FUNDER3_EMAIL)) {
            log.info("DataSeedRunner: funder3 already exists, skipping.");
            return;
        }

        User funder = User.builder()
                .email(FUNDER3_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName("Khamis")
                .lastName("Khamis")
                .role(Role.FUNDER)
                .sector("Technology")
                .status("active")
                .emailApplications(true)
                .emailUpdates(true)
                .emailReminders(true)
                .build();
        funder = userRepository.save(funder);

        Organization org = Organization.builder()
                .funder(funder)
                .name("Khamis Foundation")
                .email(FUNDER3_EMAIL)
                .location("Zanzibar")
                .type("Private Foundation")
                .status(OrganizationStatus.APPROVED)
                .build();
        organizationRepository.save(org);

        log.warn("DataSeedRunner: created APPROVED funder '{}' (password: '{}') with org '{}'.",
                FUNDER3_EMAIL, TEST_PASSWORD, org.getName());
    }

    private void seedPendingFunder() {
        if (userRepository.existsByEmail(FUNDER4_EMAIL)) {
            log.info("DataSeedRunner: funder4 already exists, skipping.");
            return;
        }

        User funder = User.builder()
                .email(FUNDER4_EMAIL)
                .password(passwordEncoder.encode(TEST_PASSWORD))
                .firstName("Asha")
                .lastName("Pending")
                .role(Role.FUNDER)
                .sector("Education")
                .status("active")
                .emailApplications(true)
                .emailUpdates(true)
                .emailReminders(true)
                .build();
        funder = userRepository.save(funder);

        Organization org = Organization.builder()
                .funder(funder)
                .name("Asha Education Trust")
                .email(FUNDER4_EMAIL)
                .location("Dar es Salaam")
                .type("NGO")
                .status(OrganizationStatus.PENDING)
                .build();
        organizationRepository.save(org);

        log.warn("DataSeedRunner: created PENDING funder '{}' (password: '{}') with org '{}'.",
                FUNDER4_EMAIL, TEST_PASSWORD, org.getName());
    }

    // ── Club surface (Phase 4) ────────────────────────────────────────

    /**
     * Hard-coded university roster — the 4 Zanzibar-area institutions that
     * host Innovation Club branches. Read-only after first startup.
     *
     * Leaders and branches are NOT seeded — the admin creates them via
     * POST /api/admin/club-leaders and POST /api/club/branches.
     */
    private static final List<University> UNIVERSITIES = List.of(
            University.builder()
                    .name("The State University of Zanzibar")
                    .shortName("SUZA")
                    .regNumberPrefix("SUZA/")
                    .primaryColor("#0f766e")
                    .tagline("Ubunifu wa Visiwani")
                    .build(),
            University.builder()
                    .name("Karume Institute of Science and Technology")
                    .shortName("KIST")
                    .regNumberPrefix("KIST/")
                    .primaryColor("#1d4ed8")
                    .tagline("Sayansi na Teknolojia kwa Maendeleo")
                    .build(),
            University.builder()
                    .name("AbdulRahman Al-Sumait University")
                    .shortName("SUMAIT")
                    .regNumberPrefix("SUMAIT/")
                    .primaryColor("#dc2626")
                    .tagline("Elimu, Utafiti, Huduma")
                    .build(),
            University.builder()
                    .name("Zanzibar University")
                    .shortName("ZU")
                    .regNumberPrefix("ZU/")
                    .primaryColor("#7c3aed")
                    .tagline("Ubunifu kwa Mustaqbali")
                    .build()
    );

    private void seedUniversities() {
        for (University u : UNIVERSITIES) {
            if (universityRepository.findByShortName(u.getShortName()).isPresent()) continue;
            universityRepository.save(u);
            log.warn("DataSeedRunner: created university '{}' ({})", u.getShortName(), u.getName());
        }
    }
}