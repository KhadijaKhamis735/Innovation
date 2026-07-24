package com.example.Innovation_backend.project.attachment;

/**
 * Wraps any IO failure in {@link StorageProvider} so the global exception
 * handler can map it to HTTP 500 without leaking filesystem details.
 */
public class StorageException extends RuntimeException {
    public StorageException(String message) {
        super(message);
    }

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
