package com.example.Innovation_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables @CreatedDate / @LastModifiedDate on entities.
 * Without this, those columns remain null.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
