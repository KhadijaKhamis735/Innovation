package com.example.Innovation_backend.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Tiny public liveness endpoint used by:
 *   - developers as a smoke test after `mvn spring-boot:run`
 *   - Phase 1 to prove security is wired (public → 200, protected → 401)
 *   - uptime monitors in production
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "Innovation_backend",
                "timestamp", Instant.now().toString()
        );
    }
}
