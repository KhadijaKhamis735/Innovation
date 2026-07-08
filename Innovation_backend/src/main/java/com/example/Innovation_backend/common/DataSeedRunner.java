package com.example.Innovation_backend.common;

import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-time seeding on first startup. Idempotent — checks for existing rows
 * before inserting. Currently creates a default admin user so that you can
 * test admin endpoints immediately after Phase 2.
 *
 * Run with: mvn spring-boot:run (it executes automatically once the context
 * is ready, before Tomcat starts serving traffic).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeedRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@innovation.local";
    private static final String ADMIN_PASSWORD = "Admin123!";

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
    }

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
}
