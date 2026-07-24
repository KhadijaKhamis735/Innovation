package com.example.Innovation_backend.project.attachment;

import java.io.IOException;
import java.io.InputStream;

/**
 * Abstraction over file persistence so we can swap local disk for S3/MinIO
 * later without touching the service layer.
 *
 * Contract:
 *   - {@link #store(String, InputStream, long)} writes the bytes to a path
 *     relative to the configured root and returns the absolute storage
 *     identifier. The path must be safe (no "..", no absolute paths).
 *   - {@link #read(String)} streams the bytes back. Throws {@link StorageException}
 *     when the file is missing.
 *   - {@link #delete(String)} is idempotent — missing files are not an error.
 */
public interface StorageProvider {

    StoredObject store(String relativePath, InputStream content, long size) throws IOException;

    InputStream read(String storagePath) throws IOException;

    void delete(String storagePath) throws IOException;

    /** Result of a successful {@link #store}. */
    record StoredObject(String storagePath, long sizeBytes) {}
}
