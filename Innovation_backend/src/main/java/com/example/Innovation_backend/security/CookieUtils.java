package com.example.Innovation_backend.security;

import com.example.Innovation_backend.config.RefreshProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * Build / read / clear the refresh-token cookie.
 *
 * The cookie is:
 *   - HttpOnly  → JS in the page can't read it (XSS-safe)
 *   - Secure    → only sent over HTTPS in production (configurable for local dev)
 *   - SameSite=Lax → sent on top-level navigations but not on cross-site POSTs
 *   - Path=/    → sent on every API call
 *
 * The Set-Cookie header is built with {@link ResponseCookie} so the SameSite
 * attribute is honored correctly (Servlet's Cookie class doesn't expose it).
 */
@Component
public class CookieUtils {

    private final RefreshProperties props;

    public CookieUtils(RefreshProperties props) {
        this.props = props;
    }

    public void writeRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(props.cookieName(), token)
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite(props.cookieSameSite())
                .path(props.cookiePath())
                .maxAge(props.expirationMs() / 1000)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(props.cookieName(), "")
                .httpOnly(true)
                .secure(props.cookieSecure())
                .sameSite(props.cookieSameSite())
                .path(props.cookiePath())
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    /** Read the refresh token from the request's cookies. Returns null if missing. */
    public String readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (props.cookieName().equals(c.getName())) {
                String v = c.getValue();
                return (v == null || v.isBlank()) ? null : v;
            }
        }
        return null;
    }
}
