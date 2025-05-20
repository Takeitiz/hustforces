package com.hust.hustforces.service;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.model.dto.admin.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface AdminProblemService {
    public AdminProblemResponseDto createProblem(CreateProblemRequest request, String creatorId);
    public FileUploadResponseDto uploadProblemDescription(String slug, MultipartFile file);
    public FileUploadResponseDto uploadProblemStructure(String slug, MultipartFile file);
    public TestCaseUploadResponseDto uploadTestCase(String slug, MultipartFile inputFile, MultipartFile outputFile, int index);
    public BoilerplateGenerationResponseDto generateBoilerplate(String slug);
    public Page<AdminProblemSummaryDto> getAllProblems(Pageable pageable);
    public AdminProblemDetailDto getProblemBySlug(String slug);
    public void deleteProblem(String slug);
    public AdminProblemResponseDto toggleProblemVisibility(String slug, boolean hidden);
    public AdminProblemResponseDto updateProblemDifficulty(String slug, Difficulty difficulty);
    AdminProblemResponseDto updateProblem(String slug, UpdateProblemRequest request);
}
