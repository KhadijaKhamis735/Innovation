package com.example.Innovation_backend.project.attachment;

import com.example.Innovation_backend.auth.WriteGuard;
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
 *   GET    /api/projects/{id}/attachments
 *   GET    /api/projects/{id}/attachments/{attId}  (binary stream)
 *   DELETE /api/projects/{id}/attachments/{attId}
 *
 * Phase 6B — write methods (upload, delete) require verified email.
 */
@RestController
@RequiredArgsConstructor
public class ProjectAttachmentController {

    private final ProjectAttachmentService service;
    private final WriteGuard writeGuard;

    @PostMapping(path = "/api/projects/{id}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProjectAttachmentResponse> upload(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "kind", required = false) AttachmentKind kind,
            @RequestPart(value = "caption", required = false) String caption) {
        writeGuard.requireVerified();
        ProjectAttachmentResponse created = service.upload(id, file, kind, caption, currentEmail());
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
