package com.hust.hustforces.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;

@Service
@Slf4j
public class FileStorageService {

    public void saveFile(MultipartFile file, String filePath) throws IOException {
        // Create parent directories if they don't exist
        Path path = Paths.get(filePath);
        Files.createDirectories(path.getParent());

        // Save the file
        Files.copy(file.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);
        log.debug("Saved file: {}", filePath);
    }

    public void deleteFile(String filePath) throws IOException {
        Path path = Paths.get(filePath);
        Files.deleteIfExists(path);
        log.debug("Deleted file: {}", filePath);
    }

    public void deleteDirectory(String directoryPath) throws IOException {
        Path path = Paths.get(directoryPath);
        if (Files.exists(path)) {
            Files.walk(path)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                        } catch (IOException e) {
                            log.error("Error deleting file: {}", p, e);
                        }
                    });
            log.debug("Deleted directory: {}", directoryPath);
        }
    }

    public boolean checkFileExists(String filePath) {
        return Files.exists(Paths.get(filePath));
    }
}
