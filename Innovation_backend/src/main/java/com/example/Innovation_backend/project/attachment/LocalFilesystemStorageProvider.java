package com.example.Innovation_backend.project.attachment;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Local filesystem implementation of {@link StorageProvider}. Layout under the
 * configured root:
 *
 *   {root}/projects/{projectId}/{uuid}-{safeName}      ← committed file
 *   {root}/projects/{projectId}/_pending/{uuid}-{name}  ← mid-upload staging
 *
 * The 2-stage commit pattern keeps files off the project's final path until
 * the DB row is about to commit. The service layer is responsible for moving
 * the file via {@link #commit(String)}; if the transaction rolls back the
 * staging file can be reaped by a future cleanup pass.
 *
 * Path-traversal protection: every {@code relativePath} passed in is normalised
 * and asserted to live under {@link #root}. Anything that escapes the root
 * throws {@link StorageException} (→ 500).
 */
@Component
@Slf4j
public class LocalFilesystemStorageProvider implements StorageProvider {

    private final Path root;
    private final java.security.SecureRandom rng = new java.security.SecureRandom();

    public LocalFilesystemStorageProvider(
            @Value("${innovation.storage.root:/var/innovation/uploads}") String rootPath) {
        this.root = Paths.get(rootPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    void ensureRoot() throws IOException {
        try {
            Files.createDirectories(root);
        } catch (java.nio.file.AccessDeniedException ade) {
            throw new StorageException(
                    "Cannot create storage root at " + root + ": permission denied. " +
                    "Set the INNOVATION_STORAGE_ROOT env var or pass " +
                    "-Dinnovation.storage.root=<writable-dir> on the JVM command line.",
                    ade);
        }
        log.info("LocalFilesystemStorageProvider root = {}", root);
    }

    @Override
    public StoredObject store(String relativePath, InputStream content, long size) throws IOException {
        Path target = resolveSafe(relativePath);
        // Idempotent: if a caller retries after a network blip, an existing file is fine.
        Files.createDirectories(target.getParent());
        long written = Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        return new StoredObject(relativePath, written);
    }

    /**
     * Move a file from a {@code _pending/} staging path to its final committed
     * location under the same project directory. Atomic on POSIX; on Windows
     * the rename may overwrite if the destination exists (which we want —
     * same UUID never lands twice in normal flow).
     */
    public void commit(String pendingPath, String finalRelativePath) throws IOException {
        Path src = resolveSafe(pendingPath);
        Path dst = resolveSafe(finalRelativePath);
        Files.createDirectories(dst.getParent());
        Files.move(src, dst, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    @Override
    public InputStream read(String storagePath) throws IOException {
        Path p = resolveSafe(storagePath);
        if (!Files.exists(p)) {
            throw new NoSuchFileException(storagePath);
        }
        return Files.newInputStream(p);
    }

    @Override
    public void delete(String storagePath) throws IOException {
        Path p = resolveSafe(storagePath);
        try {
            Files.deleteIfExists(p);
        } catch (NoSuchFileException ignored) {
            // idempotent — already gone
        }
    }

    /**
     * Build a safe, UUID-prefixed filename inside a project's directory.
     * The {@code kind} folder is currently unused but kept for future kinds
     * (e.g. portfolio/logo separation).
     */
    public String buildPath(Long projectId, String originalFilename) {
        String safe = sanitize(originalFilename);
        String uuid = newUUID();
        // stored under projects/{id}/ directly — kind is tracked in the DB column, not the path
        return "projects/" + projectId + "/" + uuid + "-" + safe;
    }

    /** Same shape, but with the {@code _pending/} prefix so a rollback doesn't leave orphans. */
    public String buildPendingPath(Long projectId, String originalFilename) {
        String safe = sanitize(originalFilename);
        String uuid = newUUID();
        return "projects/" + projectId + "/_pending/" + uuid + "-" + safe;
    }

    /**
     * Reject anything that escapes the root. Throws {@link StorageException}
     * with a deliberately non-leaky message (no user input echoed back).
     */
    private Path resolveSafe(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            throw new StorageException("Storage path is required");
        }
        Path abs = root.resolve(relativePath).normalize().toAbsolutePath();
        if (!abs.startsWith(root)) {
            throw new StorageException("Storage path escapes the configured root");
        }
        return abs;
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        // Strip control chars, separators, and "..". Cap at 100 chars.
        String cleaned = name.replaceAll("[\\\\/\\u0000-\\u001F\\u007F]", "_")
                .replace("..", "_")
                .trim();
        if (cleaned.isEmpty()) return "file";
        if (cleaned.length() > 100) cleaned = cleaned.substring(cleaned.length() - 100);
        return cleaned;
    }

    private String newUUID() {
        byte[] buf = new byte[16];
        rng.nextBytes(buf);
        long msb = 0, lsb = 0;
        for (int i = 0; i < 8; i++) msb = (msb << 8) | (buf[i] & 0xFF);
        for (int i = 8; i < 16; i++) lsb = (lsb << 8) | (buf[i] & 0xFF);
        return new UUID(msb, lsb).toString();
    }
}
