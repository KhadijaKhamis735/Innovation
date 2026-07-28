package com.example.Innovation_backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Refresh token configuration bound from {@code application.properties}
 * under the {@code app.refresh} prefix.
 *
 * Defaults: access token 15 minutes, refresh token 7 days.
 */
@ConfigurationProperties(prefix = "app.refresh")
public record RefreshProperties(
        long accessExpirationMs,
        long expirationMs,
        String cookieName,
        boolean cookieSecure,
        String cookiePath,
        String cookieSameSite
) {
    public RefreshProperties {
        if (accessExpirationMs <= 0) accessExpirationMs = 15 * 60 * 1000L;     // 15 min
        if (expirationMs <= 0) expirationMs = 7L * 24 * 60 * 60 * 1000L;       // 7 days
        if (cookieName == null || cookieName.isBlank()) cookieName = "refresh_token";
        if (cookiePath == null || cookiePath.isBlank()) cookiePath = "/";
        if (cookieSameSite == null || cookieSameSite.isBlank()) cookieSameSite = "Lax";
    }
}
