package com.example.Innovation_backend.common;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Outbound email. Phase 6B — wraps {@link JavaMailSender} (configured in
 * application.properties under {@code spring.mail.*}). In dev the SMTP creds
 * are real (Gmail app password) so verification emails actually arrive.
 *
 * Failures are logged at WARN and swallowed — we don't want a mail outage to
 * block registration. The user can always re-trigger verification later by
 * hitting the resend endpoint (TODO, or we issue a fresh token on each login
 * attempt if unverified).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromAddress;

    /** Send a plain-text email. Best-effort — failures are logged, never thrown. */
    public void send(String to, String subject, String body) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(fromAddress);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(body);
        try {
            mailSender.send(msg);
            log.debug("Sent email to {} subject='{}'", to, subject);
        } catch (MailException ex) {
            log.warn("Failed to send email to {} subject='{}': {}", to, subject, ex.getMessage());
        }
    }
}
