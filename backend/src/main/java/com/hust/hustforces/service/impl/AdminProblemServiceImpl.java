package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.admin.*;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.service.AdminProblemService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProblemServiceImpl implements AdminProblemService {
    private final ProblemRepository problemRepository;
    private final FileStorageService fileStorageService;
    private final BoilerplateGeneratorService boilerplateGeneratorService;
    private final SubmissionRepository submissionRepository;

    @Value("${mount.path}")
    private String mountPath;

    @Override
    @Transactional
    public AdminProblemResponseDto createProblem(CreateProblemRequest request, String creatorId) {
        // Check if slug already exists
        if (problemRepository.existsBySlug(request.getSlug())) {
            throw new IllegalArgumentException("A problem with slug " + request.getSlug() + " already exists");
        }

        // Create problem directory structure
        String problemPath = mountPath + "/" + request.getSlug();
        createProblemDirectories(problemPath);

        // Create problem entity
        Problem problem = Problem.builder()
                .title(request.getTitle())
                .slug(request.getSlug())
                .description("") // Will be populated later with uploaded file
                .hidden(request.isHidden())
                .difficulty(request.getDifficulty())
                .build();

        Problem savedProblem = problemRepository.save(problem);
        log.info("Created new problem: {}", savedProblem.getSlug());

        return AdminProblemResponseDto.builder()
                .id(savedProblem.getId())
                .title(savedProblem.getTitle())
                .slug(savedProblem.getSlug())
                .difficulty(savedProblem.getDifficulty())
                .hidden(savedProblem.isHidden())
                .hasDescription(false)
                .hasStructure(false)
                .testCaseCount(0)
                .boilerplateGenerated(false)
                .createdAt(savedProblem.getCreatedAt())
                .updatedAt(savedProblem.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public AdminProblemResponseDto updateProblem(String slug, UpdateProblemRequest request) {
        log.info("Processing update for problem with slug: {}", slug);

        // Get the problem entity
        Problem problem = getProblemBySlugOrThrow(slug);

        // Update problem entity properties
        problem.setTitle(request.getTitle());
        problem.setDifficulty(request.getDifficulty());
        problem.setHidden(request.isHidden());

        // Save the updated problem
        Problem updatedProblem = problemRepository.save(problem);

        // Update files
        updateProblemFiles(slug, request);

        log.info("Successfully updated problem: {}", slug);
        return mapToAdminProblemResponse(updatedProblem);
    }

    @Override
    public FileUploadResponseDto uploadProblemDescription(String slug, MultipartFile file) {
        Problem problem = getProblemBySlugOrThrow(slug);

        if (!file.getOriginalFilename().endsWith(".md")) {
            throw new IllegalArgumentException("Description file must be a markdown (.md) file");
        }

        try {
            String filePath = mountPath + "/" + slug + "/Problem.md";
            fileStorageService.saveFile(file, filePath);

            // Read the file to update the problem description in the database
            String description = new String(file.getBytes(), StandardCharsets.UTF_8);
            problem.setDescription(description);
            problemRepository.save(problem);

            return FileUploadResponseDto.builder()
                    .fileName("Problem.md")
                    .fileType(file.getContentType())
                    .size(file.getSize())
                    .success(true)
                    .message("Problem description uploaded successfully")
                    .build();
        } catch (IOException e) {
            log.error("Error uploading problem description", e);
            throw new RuntimeException("Failed to upload problem description", e);
        }
    }

    @Override
    public FileUploadResponseDto uploadProblemStructure(String slug, MultipartFile file) {
        getProblemBySlugOrThrow(slug); // Validate problem exists

        if (!file.getOriginalFilename().endsWith(".md")) {
            throw new IllegalArgumentException("Structure file must be a markdown (.md) file");
        }

        try {
            String filePath = mountPath + "/" + slug + "/Structure.md";
            fileStorageService.saveFile(file, filePath);

            return FileUploadResponseDto.builder()
                    .fileName("Structure.md")
                    .fileType(file.getContentType())
                    .size(file.getSize())
                    .success(true)
                    .message("Problem structure uploaded successfully")
                    .build();
        } catch (IOException e) {
            log.error("Error uploading problem structure", e);
            throw new RuntimeException("Failed to upload problem structure", e);
        }
    }

    @Override
    public TestCaseUploadResponseDto uploadTestCase(
            String slug, MultipartFile inputFile, MultipartFile outputFile, int index) {
        getProblemBySlugOrThrow(slug); // Validate problem exists

        try {
            String inputPath = mountPath + "/" + slug + "/tests/inputs/" + index + ".txt";
            String outputPath = mountPath + "/" + slug + "/tests/outputs/" + index + ".txt";

            fileStorageService.saveFile(inputFile, inputPath);
            fileStorageService.saveFile(outputFile, outputPath);

            return TestCaseUploadResponseDto.builder()
                    .index(index)
                    .inputFileName(index + ".txt")
                    .outputFileName(index + ".txt")
                    .inputSize(inputFile.getSize())
                    .outputSize(outputFile.getSize())
                    .success(true)
                    .message("Test case uploaded successfully")
                    .build();
        } catch (IOException e) {
            log.error("Error uploading test case", e);
            throw new RuntimeException("Failed to upload test case", e);
        }
    }

    @Override
    public BoilerplateGenerationResponseDto generateBoilerplate(String slug) {
        Problem problem = getProblemBySlugOrThrow(slug);
        String problemPath = mountPath + "/" + slug;

        // Check if structure file exists
        Path structurePath = Paths.get(problemPath, "Structure.md");
        if (!Files.exists(structurePath)) {
            throw new IllegalArgumentException("Structure.md file not found for problem: " + slug);
        }

        try {
            // Run boilerplate generator
            List<String> generatedFiles = boilerplateGeneratorService.generateBoilerplateCode(problemPath);

            return BoilerplateGenerationResponseDto.builder()
                    .success(true)
                    .message("Boilerplate code generated successfully")
                    .generatedFiles(generatedFiles)
                    .build();
        } catch (Exception e) {
            log.error("Error generating boilerplate code", e);
            throw new RuntimeException("Failed to generate boilerplate code", e);
        }
    }



    @Override
    public AdminProblemDetailDto getProblemBySlug(String slug) {
        Problem problem = getProblemBySlugOrThrow(slug);
        return mapToAdminProblemDetail(problem);
    }

    @Override
    @Transactional
    public void deleteProblem(String slug) {
        Problem problem = getProblemBySlugOrThrow(slug);

        // Delete problem files
        try {
            fileStorageService.deleteDirectory(mountPath + "/" + slug);
        } catch (IOException e) {
            log.error("Error deleting problem files", e);
            // Continue with deleting the database entry even if file deletion fails
        }

        // Delete problem entity
        problemRepository.delete(problem);
        log.info("Deleted problem: {}", slug);
    }

    @Override
    @Transactional
    public AdminProblemResponseDto toggleProblemVisibility(String slug, boolean hidden) {
        Problem problem = getProblemBySlugOrThrow(slug);
        problem.setHidden(hidden);
        Problem updatedProblem = problemRepository.save(problem);

        log.info("Updated problem visibility: {}, hidden: {}", slug, hidden);
        return mapToAdminProblemResponse(updatedProblem);
    }

    @Override
    @Transactional
    public AdminProblemResponseDto updateProblemDifficulty(String slug, Difficulty difficulty) {
        Problem problem = getProblemBySlugOrThrow(slug);
        problem.setDifficulty(difficulty);
        Problem updatedProblem = problemRepository.save(problem);

        log.info("Updated problem difficulty: {}, difficulty: {}", slug, difficulty);
        return mapToAdminProblemResponse(updatedProblem);
    }

    @Override
    public Page<AdminProblemSummaryDto> getAllProblems(Pageable pageable) {
        return problemRepository.findAll(pageable)
                .map(this::mapToAdminProblemSummary);
    }

    private void updateProblemFiles(String slug, UpdateProblemRequest request) {
        try {
            // Create problem directory structure if it doesn't exist
            String problemPath = mountPath + "/" + slug;
            Files.createDirectories(Paths.get(problemPath));
            Files.createDirectories(Paths.get(problemPath, "tests", "inputs"));
            Files.createDirectories(Paths.get(problemPath, "tests", "outputs"));

            log.debug("Writing problem description file");
            // Write description file
            Files.writeString(Paths.get(problemPath, "Problem.md"), request.getDescription());

            log.debug("Writing problem structure file");
            // Write structure file
            Files.writeString(Paths.get(problemPath, "Structure.md"), request.getStructure());

            // Write testcase files
            if (request.getTestcases() != null && !request.getTestcases().isEmpty()) {
                log.debug("Writing {} test case files", request.getTestcases().size());

                // Clear existing test files to avoid orphaned files
                try (Stream<Path> inputFiles = Files.list(Paths.get(problemPath, "tests", "inputs"))) {
                    inputFiles.forEach(file -> {
                        try {
                            Files.delete(file);
                        } catch (IOException e) {
                            log.warn("Failed to delete input file: {}", file, e);
                        }
                    });
                }

                try (Stream<Path> outputFiles = Files.list(Paths.get(problemPath, "tests", "outputs"))) {
                    outputFiles.forEach(file -> {
                        try {
                            Files.delete(file);
                        } catch (IOException e) {
                            log.warn("Failed to delete output file: {}", file, e);
                        }
                    });
                }

                for (int i = 0; i < request.getTestcases().size(); i++) {
                    TestcaseUpdateDto testcase = request.getTestcases().get(i);
                    // Use the index position (i) for the filenames
                    Files.writeString(Paths.get(problemPath, "tests", "inputs", i + ".txt"), testcase.getInput());
                    Files.writeString(Paths.get(problemPath, "tests", "outputs", i + ".txt"), testcase.getOutput());
                }
            }
        } catch (IOException e) {
            log.error("Error updating problem files for slug: {}", slug, e);
            throw new RuntimeException("Failed to update problem files: " + e.getMessage(), e);
        }
    }

    private Problem getProblemBySlugOrThrow(String slug) {
        return problemRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "slug", slug));
    }

    private void createProblemDirectories(String problemPath) {
        try {
            Files.createDirectories(Paths.get(problemPath));
            Files.createDirectories(Paths.get(problemPath, "boilerplate"));
            Files.createDirectories(Paths.get(problemPath, "boilerplate-full"));
            Files.createDirectories(Paths.get(problemPath, "tests", "inputs"));
            Files.createDirectories(Paths.get(problemPath, "tests", "outputs"));
        } catch (IOException e) {
            log.error("Error creating problem directories", e);
            throw new RuntimeException("Failed to create problem directories", e);
        }
    }

    private AdminProblemSummaryDto mapToAdminProblemSummary(Problem problem) {
        String problemPath = mountPath + "/" + problem.getSlug();

        boolean hasDescription = Files.exists(Paths.get(problemPath, "Problem.md"));
        boolean hasStructure = Files.exists(Paths.get(problemPath, "Structure.md"));
        boolean hasBoilerplate = Files.exists(Paths.get(problemPath, "boilerplate", "function.java"));

        int testCaseCount = 0;
        try {
            if (Files.exists(Paths.get(problemPath, "tests", "inputs"))) {
                testCaseCount = (int) Files.list(Paths.get(problemPath, "tests", "inputs")).count();
            }
        } catch (IOException e) {
            log.error("Error counting test cases", e);
        }

        return AdminProblemSummaryDto.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .difficulty(problem.getDifficulty())
                .hidden(problem.isHidden())
                .hasDescription(hasDescription)
                .hasStructure(hasStructure)
                .testCaseCount(testCaseCount)
                .boilerplateGenerated(hasBoilerplate)
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }

    private AdminProblemDetailDto mapToAdminProblemDetail(Problem problem) {
        String problemPath = mountPath + "/" + problem.getSlug();

        String description = "";
        List<TestcaseDto> testcases = new ArrayList<>();
        int submissionCount = 0;
        int acceptedCount = 0;
        List<String> tags = new ArrayList<>(); // Default empty list, replace with actual tags if available

        try {
            // Read problem description
            if (Files.exists(Paths.get(problemPath, "Problem.md"))) {
                description = new String(Files.readAllBytes(Paths.get(problemPath, "Problem.md")));
            }

            // Load test cases
            if (Files.exists(Paths.get(problemPath, "tests", "inputs"))) {
                List<Path> inputFiles = Files.list(Paths.get(problemPath, "tests", "inputs")).collect(Collectors.toList());

                for (Path inputFile : inputFiles) {
                    String fileName = inputFile.getFileName().toString();
                    String testId = fileName.replace(".txt", "");

                    String input = new String(Files.readAllBytes(inputFile));

                    String output = "";
                    Path outputFile = Paths.get(problemPath, "tests", "outputs", fileName);
                    if (Files.exists(outputFile)) {
                        output = new String(Files.readAllBytes(outputFile));
                    }

                    String explanation = "";
                    Path explanationFile = Paths.get(problemPath, "tests", "explanations", fileName);
                    if (Files.exists(explanationFile)) {
                        explanation = new String(Files.readAllBytes(explanationFile));
                    }

                    testcases.add(TestcaseDto.builder()
                            .id(testId)
                            .input(input)
                            .output(output)
                            .explanation(explanation)
                            .build());
                }

                // Sort testcases by id
                testcases.sort(Comparator.comparing(TestcaseDto::getId));
            }

            // Count submissions and accepted solutions
            submissionCount = (int) submissionRepository.countByProblemId(problem.getId());
            acceptedCount = (int) submissionRepository.countByProblemIdAndStatusAC(problem.getId());

        } catch (IOException e) {
            log.error("Error loading problem details", e);
        }

        // Default time and memory limits if not specified elsewhere
        int timeLimit = 1; // 1 seconds in milliseconds
        int memoryLimit = 256; // 256 MB

        return AdminProblemDetailDto.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .difficulty(problem.getDifficulty())
                .hidden(problem.isHidden())
                .description(description)
                .timeLimit(timeLimit)
                .memoryLimit(memoryLimit)
                .tags(tags)
                .testcases(testcases)
                .submissionCount(submissionCount)
                .acceptedCount(acceptedCount)
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }

    private AdminProblemResponseDto mapToAdminProblemResponse(Problem problem) {
        String problemPath = mountPath + "/" + problem.getSlug();

        boolean hasDescription = Files.exists(Paths.get(problemPath, "Problem.md"));
        boolean hasStructure = Files.exists(Paths.get(problemPath, "Structure.md"));
        boolean hasBoilerplate = Files.exists(Paths.get(problemPath, "boilerplate", "function.java"));

        int testCaseCount = 0;
        try {
            if (Files.exists(Paths.get(problemPath, "tests", "inputs"))) {
                testCaseCount = (int) Files.list(Paths.get(problemPath, "tests", "inputs")).count();
            }
        } catch (IOException e) {
            log.error("Error counting test cases", e);
        }

        return AdminProblemResponseDto.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .difficulty(problem.getDifficulty())
                .hidden(problem.isHidden())
                .hasDescription(hasDescription)
                .hasStructure(hasStructure)
                .testCaseCount(testCaseCount)
                .boilerplateGenerated(hasBoilerplate)
                .createdAt(problem.getCreatedAt())
                .updatedAt(problem.getUpdatedAt())
                .build();
    }
}
