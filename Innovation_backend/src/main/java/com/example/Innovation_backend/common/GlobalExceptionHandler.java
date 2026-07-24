package com.example.Innovation_backend.common;

import com.example.Innovation_backend.application.ApplicationService;
import com.example.Innovation_backend.club.ClubAuthService;
import com.example.Innovation_backend.project.attachment.LimitExceededException;
import com.example.Innovation_backend.project.attachment.ProjectAttachmentService;
import com.example.Innovation_backend.project.attachment.StorageException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

/**
 * Catches unhandled exceptions thrown by any controller and converts them
 * to a uniform JSON error body. Prevents stack traces from leaking to clients.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ApiError body = ApiError.of(400, "Bad Request", details, req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(401, "Unauthorized", "Invalid email or password", req.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(403, "Forbidden", "You do not have permission for this action", req.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArg(IllegalArgumentException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(400, "Bad Request", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** Thrown when a service looks up an entity by id and it doesn't exist. */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(EntityNotFoundException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(404, "Not Found", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Thrown when Spring can't match any controller route to the request URL
     * (typo, missing trailing segment, etc.). Maps to a clean 404 instead of
     * falling into the generic 500 handler.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
        log.debug("No route matched {} {}", req.getMethod(), req.getRequestURI());
        ApiError body = ApiError.of(404, "Not Found",
                "No endpoint at " + req.getRequestURI(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Duplicate application (innovator applied twice to the same opportunity).
     * Mapped to 409 Conflict — the resource is fine, but the action conflicts
     * with the current state.
     */
    @ExceptionHandler(ApplicationService.DuplicateApplicationException.class)
    public ResponseEntity<ApiError> handleDuplicateApplication(
            ApplicationService.DuplicateApplicationException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(409, "Conflict", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Application to a non-OPEN opportunity. Mapped to 410 Gone — the resource
     * is intentionally closed and not accepting new applications.
     */
    @ExceptionHandler(ApplicationService.ApplicationClosedException.class)
    public ResponseEntity<ApiError> handleApplicationClosed(
            ApplicationService.ApplicationClosedException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(410, "Gone", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.GONE).body(body);
    }

    /**
     * Email already taken on the club surface (members or leaders). 409 Conflict,
     * mirrors the application-package duplicate handling.
     */
    @ExceptionHandler(ClubAuthService.DuplicatePrincipalException.class)
    public ResponseEntity<ApiError> handleDuplicateClubPrincipal(
            ClubAuthService.DuplicatePrincipalException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(409, "Conflict", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Phase 5C-B — file exceeds Spring's multipart limit (caught at the
     * servlet layer before the controller runs). 413 Payload Too Large is
     * the precise HTTP status for this case.
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUpload(MaxUploadSizeExceededException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(413, "Payload Too Large",
                "File exceeds the maximum upload size", req.getRequestURI());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(body);
    }

    /**
     * Phase 5C-B — business-rule limit hit: 5 attachments per project, or a
     * file over the 10 MB cap that the application enforces (vs Spring's
     * 10 MB / 12 MB multipart cap, which becomes 413 above).
     */
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<ApiError> handleLimit(LimitExceededException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(422, "Unprocessable Entity", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /**
     * Phase 5C-B — attachment row exists but the underlying file is gone
     * (e.g. a cleanup pass reaped it). 410 Gone is the right code — the
     * row used to point at something, now it doesn't.
     */
    @ExceptionHandler(ProjectAttachmentService.GoneException.class)
    public ResponseEntity<ApiError> handleGone(ProjectAttachmentService.GoneException ex, HttpServletRequest req) {
        ApiError body = ApiError.of(410, "Gone", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.GONE).body(body);
    }

    /**
     * Phase 5C-B — unexpected storage IO failure (disk full, permission
     * denied, etc.). Logged at WARN with the path so we can debug without
     * leaking filesystem details to the client.
     */
    @ExceptionHandler(StorageException.class)
    public ResponseEntity<ApiError> handleStorage(StorageException ex, HttpServletRequest req) {
        log.warn("Storage error at {} {}: {}", req.getMethod(), req.getRequestURI(), ex.getMessage());
        ApiError body = ApiError.of(500, "Internal Server Error",
                "Storage error", req.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest req) {
        // Log the full stack so we can debug 500s without restarting the server.
        log.error("Unhandled exception at {} {}: {}",
                req.getMethod(), req.getRequestURI(), ex.getMessage(), ex);
        ApiError body = ApiError.of(500, "Internal Server Error",
                ex.getClass().getSimpleName() + ": " + ex.getMessage(),
                req.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
