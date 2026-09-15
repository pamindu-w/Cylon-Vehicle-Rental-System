package com.carrental.services;

import com.carrental.dto.UploadResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UploadService {

    private static final long MAX_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final Path uploadDir;

    public UploadService(@Value("${app.upload-dir}") String uploadDir) {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public UploadResponse store(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File too large (max 5 MB)");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }

        try {
            Files.createDirectories(uploadDir);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create upload directory");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String extension = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            extension = original.substring(dot).toLowerCase();
        }
        String filename = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(filename).normalize();
        if (!target.startsWith(uploadDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file");
        }

        return new UploadResponse("/uploads/" + filename);
    }
}