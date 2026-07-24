package com.example.Innovation_backend.project.attachment;

/**
 * Thrown when an upload would push a project past its attachment cap (5)
 * or when a single file exceeds the size cap (10 MB). Mapped to HTTP 422
 * by {@code GlobalExceptionHandler}.
 *
 * 422 (Unprocessable Entity) is the right code here — the request was
 * well-formed and authenticated, but the business state refuses it.
 */
public class LimitExceededException extends RuntimeException {
    public LimitExceededException(String message) {
        super(message);
    }
}
