package com.example.Innovation_backend.project.attachment;

import com.example.Innovation_backend.auth.WriteGuard;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Phase 5C-B — Evidence upload / list / download / delete on unified projects.
 *
 * Endpoints (all require authentication; the service layer enforces the
 * precise owner-or-leader-or-admin rule):
 *
 *   POST   /api/projects/{id}/attachments          (multipart/form-data)
 *   POST   /api/projects/{id}/attachments/link     (application/json)
 *   GET    /api/projects/{id}/attachments
 *   GET    /api/projects/{id}/attachments/{attId}  (binary stream; files only)
 *   DELETE /api/projects/{id}/attachments/{attId}
 *
 * Evidence is either an uploaded file or an external link — both count toward
 * the same 5-per-project cap.
 *
 * Phase 6B — write methods (upload, link, delete) require verified email.
 */
@RestController
@RequiredArgsConstructor
public class ProjectAttachmentController {

    private final ProjectAttachmentService service;
    private final WriteGuard writeGuard;

    /**
     * {@code kind} is bound as a raw String, not as {@link AttachmentKind}.
     *
     * A browser's {@code FormData.append("kind", "evidence")} sends the part
     * with no content type, which Spring treats as
     * {@code application/octet-stream} and has no converter for — the request
     * then fails with HttpMediaTypeNotSupportedException (500) before any of
     * our code runs. Taking the String and parsing it ourselves accepts both
     * browser form-data and the JSON-typed part, and routes a bad value to
     * {@link AttachmentKind#fromJson}'s IllegalArgumentException → 400.
     */
    @PostMapping(path = "/api/projects/{id}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectAttachmentResponse> upload(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "kind", required = false) String kind,
            @RequestPart(value = "caption", required = false) String caption) {
        writeGuard.requireVerified();
        AttachmentKind parsedKind = parseKind(kind);
        ProjectAttachmentResponse created = service.upload(id, file, parsedKind, caption, currentEmail());
        return ResponseEntity
                .created(java.net.URI.create(
                        "/api/projects/" + id + "/attachments/" + created.id()))
                .body(created);
    }

    @PostMapping(path = "/api/projects/{id}/attachments/link",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectAttachmentResponse> addLink(
            @PathVariable Long id,
            @Valid @RequestBody LinkAttachmentRequest req) {
        writeGuard.requireVerified();
        ProjectAttachmentResponse created =
                service.addLink(id, req.url(), req.kind(), req.caption(), currentEmail());
        return ResponseEntity
                .created(java.net.URI.create(
                        "/api/projects/" + id + "/attachments/" + created.id()))
                .body(created);
    }

    @GetMapping("/api/projects/{id}/attachments")
    @PreAuthorize("isAuthenticated()")
    public List<ProjectAttachmentResponse> list(@PathVariable Long id) {
        return service.list(id, currentEmail());
    }

    @GetMapping("/api/projects/{id}/attachments/{attId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> download(@PathVariable Long id,
                                           @PathVariable Long attId) {
        ProjectAttachmentService.DownloadedFile f = service.download(id, attId, currentEmail());
        // Small files only — capped at 10 MB by the upload path.
        byte[] payload;
        try (var in = f.stream()) {
            payload = in.readAllBytes();
        } catch (java.io.IOException ioe) {
            throw new StorageException("Failed to read attachment bytes", ioe);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(f.mimeType() != null
                ? MediaType.parseMediaType(f.mimeType())
                : MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentLength(payload.length);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, contentDisposition(f.filename()));
        return new ResponseEntity<>(payload, headers, HttpStatus.OK);
    }

    @DeleteMapping("/api/projects/{id}/attachments/{attId}")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @PathVariable Long attId) {
        writeGuard.requireVerified();
        service.delete(id, attId, currentEmail());
    }

    // ── Internals ────────────────────────────────────────────────────

    /**
     * Parse the multipart {@code kind} part. Tolerates the JSON-quoted form
     * ({@code "evidence"}) that a typed part produces as well as the bare
     * {@code evidence} a browser sends. Null/blank falls back to the
     * {@link AttachmentKind#fromJson} default.
     */
    private static AttachmentKind parseKind(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String cleaned = raw.trim();
        if (cleaned.length() >= 2 && cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
        }
        return AttachmentKind.fromJson(cleaned);
    }

    /**
     * RFC 5987 filename* with UTF-8 percent-encoding; legacy {@code filename=}
     * stripped of quotes to avoid header injection.
     */
    private static String contentDisposition(String filename) {
        if (filename == null || filename.isBlank()) {
            return "attachment";
        }
        String ascii = filename.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "");
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename=\"" + ascii + "\"; filename*=UTF-8''" + encoded;
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("No authenticated principal in SecurityContext");
        }
        return auth.getName();
    }
}
