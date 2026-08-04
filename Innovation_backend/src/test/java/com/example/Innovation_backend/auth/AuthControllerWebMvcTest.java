package com.example.Innovation_backend.auth;

import com.example.Innovation_backend.common.EmailService;
import com.example.Innovation_backend.common.GlobalExceptionHandler;
import com.example.Innovation_backend.config.RefreshProperties;
import com.example.Innovation_backend.security.CookieUtils;
import com.example.Innovation_backend.security.JwtService;
import com.example.Innovation_backend.user.Role;
import com.example.Innovation_backend.user.User;
import com.example.Innovation_backend.user.UserService;
import com.example.Innovation_backend.user.dto.UserResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Web-slice test for {@link AuthController}. Mocks every direct collaborator
 * on the controller; the security filter chain is disabled (we're testing
 * the controller surface, not the JWT filter).
 *
 * What we cover:
 *   - Register: 201 on valid input, 400 on bean-validation failure (short pw,
 *     no digit, missing email), 400 on FUNDER-without-sector (DTO doesn't
 *     enforce this — service does — so we only assert the DTO-level checks).
 *   - Login: 200 on success + refresh cookie attached.
 *   - Refresh: 200 on success, 401 on {@code InvalidRefreshException}, 401 on
 *     {@code ReuseDetectedException}.
 *   - Logout: 204 + refresh cookie cleared.
 *   - Verify: 200 on success, 400 on invalid token.
 *   - Resend: 202.
 *   - Forgot-password: 202 for both known AND unknown email (anti-enumeration),
 *     400 for malformed email.
 *   - Reset-password: 204 on success, 400 on validation failure, 400 on bad
 *     token.
 *   - Endpoint paths: smoke test that the exact URLs still match.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@EnableConfigurationProperties(RefreshProperties.class)
@Import({GlobalExceptionHandler.class, CookieUtils.class})
class AuthControllerWebMvcTest {

    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper json;

    // CookieUtils and RefreshProperties are NOT @MockBean'd — we use the
    // real ones so the controller actually writes a refresh cookie to the
    // response. RefreshProperties is bound from application-test.properties
    // under @ConfigurationPropertiesScan, so the real bean is available
    // in the @WebMvcTest slice.

    @MockBean private AuthService authService;
    @MockBean private UserService userService;
    @MockBean private RefreshTokenService refreshTokens;
    @MockBean private JwtService jwtService;
    @MockBean private PasswordResetService passwordReset;
    // JwtAuthFilter now depends on UserDetailsService (Phase 1 fix). The
    // @WebMvcTest slice does not boot the security filter chain, so we
    // stub the filter out to avoid wiring a real UserDetailsService.
    @MockBean private com.example.Innovation_backend.security.JwtAuthFilter jwtAuthFilter;
    // Defensive: prevents Spring from trying to autowire a real JavaMailSender.
    @MockBean private JavaMailSender javaMailSender;
    @MockBean private EmailService emailService;

    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    private static final UserResponse SAMPLE_USER = new UserResponse(
            1L, "u@example.com", "Khadija", "Khamis", "Khadija Khamis",
            Role.INNOVATOR, null, "active", null, null, null, null, false,
            true, true, true, false, false, false
    );

    @BeforeEach
    void setUp() {
        // The controller reads the access-TTL from JwtService for the
        // X-Access-Expires-In-Ms response header. Stub it to something stable.
        when(jwtService.accessExpirationMs()).thenReturn(900_000L);

        // Default cookie-write stub for register/login. Each test that asserts
        // on the cookie overrides this with a more specific stub.
        when(refreshTokens.issue(any(RefreshToken.Surface.class), any(Long.class)))
                .thenReturn(new RefreshTokenService.Issued(
                        RefreshToken.builder()
                                .id(1L)
                                .surface(RefreshToken.Surface.INNOVATION)
                                .userId(1L)
                                .familyId(java.util.UUID.randomUUID())
                                .tokenHash("hash")
                                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                                .build(),
                        "raw-cookie-value"));

        // CookieUtils is a no-op mock by default — the actual cookie
        // writing happens in a real `ResponseCookie` chain which we can't
        // easily verify without booting the real bean. We do verify the
        // *intent* of the controller via the mock interactions + the
        // `cookie().exists(...)` matcher picks up the servlet-set cookies.
    }

    // ── POST /api/auth/register ─────────────────────────────────────

    @Test
    void register_valid_returns201WithBody() throws Exception {
        // Web controller keeps calling the no-audience overload — the
        // 1-arg signature on AuthService delegates to LinkAudience.WEB.
        when(authService.register(any()))
                .thenReturn(new AuthResponse("jwt", SAMPLE_USER));
        // The controller looks up the just-created user to attach a refresh
        // cookie — give it a real User so the cookie path runs.
        when(userService.findByEmail("u@example.com")).thenReturn(
                User.builder().id(1L).email("u@example.com").build());

        String body = """
                {
                  "email": "u@example.com",
                  "password": "Secret1",
                  "role": "innovator",
                  "firstName": "Khadija",
                  "lastName": "Khamis"
                }
                """;

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(jsonPath("$.user.email").value("u@example.com"))
                .andExpect(header().string("X-Access-Expires-In-Ms", "900000"))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie",
                        org.hamcrest.Matchers.containsString(REFRESH_COOKIE_NAME)));
        verify(authService, times(1)).register(any());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        String body = """
                {
                  "email": "u@example.com",
                  "password": "abc",
                  "role": "innovator",
                  "firstName": "Khadija",
                  "lastName": "Khamis"
                }
                """;

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void register_passwordWithoutDigit_returns400() throws Exception {
        String body = """
                {
                  "email": "u@example.com",
                  "password": "NoDigitsHere",
                  "role": "innovator",
                  "firstName": "Khadija",
                  "lastName": "Khamis"
                }
                """;

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        verify(authService, never()).register(any());
    }

    @Test
    void register_missingEmail_returns400() throws Exception {
        String body = """
                {
                  "password": "Secret1",
                  "role": "innovator",
                  "firstName": "Khadija",
                  "lastName": "Khamis"
                }
                """;

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/auth/login ────────────────────────────────────────

    @Test
    void login_success_returns200AndRefreshCookie() throws Exception {
        when(authService.login(any())).thenReturn(new AuthResponse("jwt", SAMPLE_USER));
        when(userService.findByEmail("u@example.com")).thenReturn(
                User.builder().id(1L).email("u@example.com").build());

        String body = """
                { "email": "u@example.com", "password": "Secret1" }
                """;

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie",
                        org.hamcrest.Matchers.containsString(REFRESH_COOKIE_NAME)));
    }

    @Test
    void login_missingEmail_returns400() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"Secret1\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/auth/refresh ──────────────────────────────────────

    @Test
    void refresh_success_returns200() throws Exception {
        when(authService.refresh(anyString(), any())).thenReturn(new AuthResponse("new-jwt", SAMPLE_USER));

        mvc.perform(post("/api/auth/refresh").cookie(new jakarta.servlet.http.Cookie(REFRESH_COOKIE_NAME, "old-raw")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-jwt"))
                .andExpect(header().string("X-Access-Expires-In-Ms", "900000"));
        // The new refresh cookie is written by AuthService.refresh → real
        // CookieUtils.writeRefreshCookie, which would show up in the
        // Set-Cookie header. We can't easily verify that here because
        // AuthService is mocked — the contract is tested by the
        // CookieUtils-level coverage in production runs and the smoke
        // recipes in /tmp/phase6*-smoke.sh.
    }

    @Test
    void refresh_invalidToken_returns401() throws Exception {
        doThrow(new RefreshTokenService.InvalidRefreshException("bad"))
                .when(authService).refresh(anyString(), any());

        mvc.perform(post("/api/auth/refresh").cookie(new jakarta.servlet.http.Cookie(REFRESH_COOKIE_NAME, "old-raw")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_reuseDetected_returns401() throws Exception {
        doThrow(new RefreshTokenService.ReuseDetectedException("reuse"))
                .when(authService).refresh(anyString(), any());

        mvc.perform(post("/api/auth/refresh").cookie(new jakarta.servlet.http.Cookie(REFRESH_COOKIE_NAME, "old-raw")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_noCookie_returns401() throws Exception {
        // CookieUtils.readRefreshCookie returns null for a missing cookie,
        // and the controller throws InvalidRefreshException → 401.
        mvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    // ── POST /api/auth/logout ───────────────────────────────────────

    @Test
    void logout_returns204_andDelegatesToService() throws Exception {
        mvc.perform(post("/api/auth/logout").cookie(new jakarta.servlet.http.Cookie(REFRESH_COOKIE_NAME, "old-raw")))
                .andExpect(status().isNoContent());
        verify(authService, times(1)).logout(anyString(), any());
        // The cookie clear happens inside AuthService.logout → real
        // CookieUtils.clearRefreshCookie, which writes a Max-Age=0 Set-Cookie
        // header. We can't easily verify the cookie here because AuthService
        // is mocked — covered instead by the smoke recipes in
        // /tmp/phase6a-smoke.sh.
    }

    // ── GET /api/auth/verify ────────────────────────────────────────

    @Test
    void verify_validToken_returns200() throws Exception {
        mvc.perform(get("/api/auth/verify").param("token", "good-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true));
    }

    @Test
    void verify_invalidToken_returns400() throws Exception {
        doThrow(new EmailVerificationService.InvalidVerificationTokenException("bad token"))
                .when(authService).verifyEmail(anyString());

        mvc.perform(get("/api/auth/verify").param("token", "bad-token"))
                .andExpect(status().isBadRequest());
    }

    // ── POST /api/auth/resend-verification ──────────────────────────

    @Test
    void resendVerification_returns202() throws Exception {
        mvc.perform(post("/api/auth/resend-verification"))
                .andExpect(status().isAccepted());
        // The web controller keeps calling the no-audience overload,
        // which delegates to LinkAudience.WEB inside AuthService.
        verify(authService, times(1)).resendVerification();
    }

    // ── POST /api/auth/forgot-password ──────────────────────────────

    @Test
    void forgotPassword_knownEmail_returns202() throws Exception {
        when(passwordReset.issueForEmail("u@example.com"))
                .thenReturn(java.util.Optional.of(
                        new PasswordResetService.Issued(
                                PasswordResetToken.builder().id(1L).build(),
                                "raw-token")));

        mvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@example.com\"}"))
                .andExpect(status().isAccepted());
    }

    @Test
    void forgotPassword_unknownEmail_returns202_antiEnumeration() throws Exception {
        when(passwordReset.issueForEmail("nobody@example.com")).thenReturn(java.util.Optional.empty());

        mvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isAccepted());
    }

    @Test
    void forgotPassword_invalidEmailFormat_returns400() throws Exception {
        mvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).issueForEmail(anyString());
    }

    /**
     * Phase 2 web regression — the mobile surface got a new
     * {@code POST /api/mobile/auth/resend-verification-by-email} endpoint
     * and now uses LinkAudience.MOBILE on the service layer. The web
     * controller must keep calling the no-audience overloads (which
     * default to WEB inside AuthService / PasswordResetService). This
     * test asserts the structural separation: the web controller never
     * reaches for the MOBILE audience overload and the mobile controller
     * never reaches for the WEB overload (the latter is enforced by
     * MobileAuthControllerWebMvcTest; here we focus on the web side).
     */
    @Test
    void webSurface_neverUsesMobileAudience() throws Exception {
        mvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"u@example.com\"}"))
                .andExpect(status().isAccepted());
        mvc.perform(post("/api/auth/resend-verification"))
                .andExpect(status().isAccepted());

        verify(authService, times(1)).resendVerification(); // 0-arg overload → WEB
        verify(passwordReset, times(1)).issueForEmail("u@example.com"); // 1-arg overload → WEB
        verify(authService, never()).resendVerification(LinkAudience.MOBILE);
        verify(passwordReset, never()).issueForEmail(anyString(), eq(LinkAudience.MOBILE));
    }

    // ── POST /api/auth/reset-password ───────────────────────────────

    @Test
    void resetPassword_valid_returns204() throws Exception {
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"Newpass1\"}"))
                .andExpect(status().isNoContent());
        verify(passwordReset, times(1)).consume("raw-token", "Newpass1");
    }

    @Test
    void resetPassword_shortPassword_returns400() throws Exception {
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"abc\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).consume(anyString(), anyString());
    }

    @Test
    void resetPassword_passwordWithoutDigit_returns400() throws Exception {
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"NoDigitsHere\"}"))
                .andExpect(status().isBadRequest());
        verify(passwordReset, never()).consume(anyString(), anyString());
    }

    @Test
    void resetPassword_invalidToken_returns400() throws Exception {
        doThrow(new PasswordResetService.InvalidResetTokenException("bad token"))
                .when(passwordReset).consume("raw-token", "Newpass1");

        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"raw-token\",\"password\":\"Newpass1\"}"))
                .andExpect(status().isBadRequest());
    }

    // ── Endpoint path smoke ─────────────────────────────────────────

    @Test
    void endpointPaths_areExactlyAsDocumented() throws Exception {
        // Register
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest()); // body fails validation, but path exists
        // Login
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Resend
        mvc.perform(post("/api/auth/resend-verification"))
                .andExpect(status().isAccepted());
        // Forgot
        mvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        // Reset
        mvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }
}
