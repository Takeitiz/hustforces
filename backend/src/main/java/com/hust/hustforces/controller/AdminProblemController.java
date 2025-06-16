package com.hust.hustforces.controller;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.model.dto.admin.*;
import com.hust.hustforces.service.AdminProblemService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/problems")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminProblemController {
    private final AdminProblemService adminProblemService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    public ResponseEntity<AdminProblemResponseDto> createProblem(
            @Valid @RequestBody CreateProblemRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        AdminProblemResponseDto problem = adminProblemService.createProblem(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(problem);
    }

    @PutMapping("/{slug}")
    public ResponseEntity<AdminProblemResponseDto> updateProblem(
            @PathVariable String slug,
            @Valid @RequestBody UpdateProblemRequest request) {
        log.info("Updating problem with slug: {}", slug);
        AdminProblemResponseDto problem = adminProblemService.updateProblem(slug, request);
        return ResponseEntity.ok(problem);
    }

    @PostMapping("/{slug}/files/description")
    public ResponseEntity<FileUploadResponseDto> uploadProblemDescription(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file) {
        FileUploadResponseDto response = adminProblemService.uploadProblemDescription(slug, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{slug}/files/structure")
    public ResponseEntity<FileUploadResponseDto> uploadProblemStructure(
            @PathVariable String slug,
            @RequestParam("file") MultipartFile file) {
        FileUploadResponseDto response = adminProblemService.uploadProblemStructure(slug, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{slug}/testcases")
    public ResponseEntity<TestCaseUploadResponseDto> uploadTestCase(
            @PathVariable String slug,
            @RequestParam("input") MultipartFile inputFile,
            @RequestParam("output") MultipartFile outputFile,
            @RequestParam("index") int index) {
        TestCaseUploadResponseDto response = adminProblemService.uploadTestCase(slug, inputFile, outputFile, index);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{slug}/generate-boilerplate")
    public ResponseEntity<BoilerplateGenerationResponseDto> generateBoilerplate(
            @PathVariable String slug) {
        BoilerplateGenerationResponseDto response = adminProblemService.generateBoilerplate(slug);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<AdminProblemSummaryDto>> getAllProblems(
            @RequestParam(required = false, defaultValue = "") String search,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {

        log.info("Fetching problems with search: '{}', page: {}, size: {}",
                search, pageable.getPageNumber(), pageable.getPageSize());

        Page<AdminProblemSummaryDto> problems = adminProblemService.getAllProblems(search.trim(), pageable);
        return ResponseEntity.ok(problems);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<AdminProblemDetailDto> getProblemBySlug(@PathVariable String slug) {
        AdminProblemDetailDto problem = adminProblemService.getProblemBySlug(slug);
        return ResponseEntity.ok(problem);
    }

    @DeleteMapping("/{slug}")
    public ResponseEntity<Void> deleteProblem(@PathVariable String slug) {
        adminProblemService.deleteProblem(slug);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{slug}/visibility")
    public ResponseEntity<AdminProblemResponseDto> toggleProblemVisibility(
            @PathVariable String slug,
            @RequestParam boolean hidden) {
        AdminProblemResponseDto problem = adminProblemService.toggleProblemVisibility(slug, hidden);
        return ResponseEntity.ok(problem);
    }

    @PutMapping("/{slug}/difficulty")
    public ResponseEntity<AdminProblemResponseDto> updateProblemDifficulty(
            @PathVariable String slug,
            @RequestParam Difficulty difficulty) {
        AdminProblemResponseDto problem = adminProblemService.updateProblemDifficulty(slug, difficulty);
        return ResponseEntity.ok(problem);
    }
}
