package com.hust.hustforces.utils;

import com.hust.hustforces.enums.LanguageId;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Utility class for problem file operations with asynchronous support
 */
@Component
@Slf4j
public class ProblemFileUtil {

    @Value("${mount.path}")
    private String mountPath;

    // Thread pool for async file operations
    private final Executor fileIoExecutor = Executors.newFixedThreadPool(10);

    /**
     * Asynchronously reads problem description
     */
    public CompletableFuture<String> readProblemDescriptionAsync(String problemSlug) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Path path = getProblemDescriptionPath(problemSlug);
                log.debug("Reading problem description from path: {}", path);
                return Files.readString(path);
            } catch (NoSuchFileException e) {
                log.warn("Problem description file not found for slug: {}", problemSlug);
                return "Problem description not available";
            } catch (IOException e) {
                log.error("Error reading problem description for slug: {}", problemSlug, e);
                throw new RuntimeException("Failed to read problem description", e);
            }
        }, fileIoExecutor);
    }

    /**
     * Asynchronously reads full boilerplate code
     */
    public CompletableFuture<String> readFullBoilerplateCodeAsync(String problemSlug, LanguageId languageId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Path path = getFullBoilerplateCodePath(problemSlug, languageId);
                log.debug("Reading full boilerplate code from path: {}", path);
                return Files.readString(path);
            } catch (NoSuchFileException e) {
                log.warn("Boilerplate code file not found for slug: {}, language: {}", problemSlug, languageId);
                return "// Boilerplate code not available for this language";
            } catch (IOException e) {
                log.error("Error reading boilerplate code for slug: {}, language: {}", problemSlug, languageId, e);
                throw new RuntimeException("Failed to read boilerplate code", e);
            }
        }, fileIoExecutor);
    }

    /**
     * Asynchronously reads test inputs
     */
    public CompletableFuture<List<String>> readTestInputsAsync(String problemSlug) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Path inputsDir = getTestInputsDirectoryPath(problemSlug);
                log.debug("Reading test inputs from directory: {}", inputsDir);

                if (!Files.exists(inputsDir)) {
                    log.warn("Test inputs directory not found for slug: {}", problemSlug);
                    return Collections.emptyList();
                }

                try (Stream<Path> paths = Files.list(inputsDir)) {
                    return paths.map(path -> {
                                try {
                                    log.trace("Reading input file: {}", path.getFileName());
                                    return Files.readString(path);
                                } catch (IOException e) {
                                    log.error("Error reading input file: {}", path, e);
                                    return "";
                                }
                            }).filter(content -> !content.isEmpty())
                            .collect(Collectors.toList());
                }
            } catch (IOException e) {
                log.error("Error listing input files for slug: {}", problemSlug, e);
                return Collections.emptyList();
            }
        }, fileIoExecutor);
    }

    /**
     * Asynchronously reads test outputs
     */
    public CompletableFuture<List<String>> readTestOutputsAsync(String problemSlug) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Path outputsDir = getTestOutputsDirectoryPath(problemSlug);
                log.debug("Reading test outputs from directory: {}", outputsDir);

                if (!Files.exists(outputsDir)) {
                    log.warn("Test outputs directory not found for slug: {}", problemSlug);
                    return Collections.emptyList();
                }

                try (Stream<Path> paths = Files.list(outputsDir)) {
                    return paths.map(path -> {
                                try {
                                    log.trace("Reading output file: {}", path.getFileName());
                                    return Files.readString(path);
                                } catch (IOException e) {
                                    log.error("Error reading output file: {}", path, e);
                                    return "";
                                }
                            }).filter(content -> !content.isEmpty())
                            .collect(Collectors.toList());
                }
            } catch (IOException e) {
                log.error("Error listing output files for slug: {}", problemSlug, e);
                return Collections.emptyList();
            }
        }, fileIoExecutor);
    }

    /**
     * Check if problem directory exists
     */
    public boolean problemDirectoryExists(String problemSlug) {
        Path problemDir = Paths.get(mountPath, problemSlug);
        return Files.exists(problemDir) && Files.isDirectory(problemDir);
    }

    /**
     * List problem slugs in mount path
     */
    public List<String> listProblemSlugs() {
        try {
            Path mountDir = Paths.get(mountPath);
            if (!Files.exists(mountDir)) {
                log.error("Mount directory does not exist: {}", mountPath);
                return Collections.emptyList();
            }

            try (Stream<Path> paths = Files.list(mountDir)) {
                return paths.filter(Files::isDirectory)
                        .map(path -> path.getFileName().toString())
                        .collect(Collectors.toList());
            }
        } catch (IOException e) {
            log.error("Error listing problem directories", e);
            return Collections.emptyList();
        }
    }

    private Path getProblemDescriptionPath(String problemSlug) {
        return Paths.get(mountPath, problemSlug, "Problem.md");
    }

    private Path getFullBoilerplateCodePath(String problemSlug, LanguageId languageId) {
        return Paths.get(mountPath, problemSlug, "boilerplate-full", "solution." + languageId);
    }

    private Path getTestInputsDirectoryPath(String problemSlug) {
        return Paths.get(mountPath, problemSlug, "tests", "inputs");
    }

    private Path getTestOutputsDirectoryPath(String problemSlug) {
        return Paths.get(mountPath, problemSlug, "tests", "outputs");
    }
}
