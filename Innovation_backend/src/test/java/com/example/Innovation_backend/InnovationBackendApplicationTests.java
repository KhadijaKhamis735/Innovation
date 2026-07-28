package com.example.Innovation_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Phase 6D: now runs against the {@code test} profile (H2 in PostgreSQL mode,
 * Flyway disabled, no real SMTP). See
 * {@code src/test/resources/application-test.properties}.
 */
@SpringBootTest
@ActiveProfiles("test")
class InnovationBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
