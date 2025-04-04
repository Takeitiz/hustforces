package com.hust.hustforces.service;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.discussion.SolutionDetailDto;
import com.hust.hustforces.model.dto.discussion.SolutionDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface SolutionService {
    SolutionDto createSolution(String code, String description, String userId, String problemId, LanguageId languageId);

    SolutionDetailDto getSolution(String id, String userId);

    SolutionDto updateSolution(String id, String code, String description, String userId);

    void deleteSolution(String id, String userId);

    Page<SolutionDto> getAllSolutions(Pageable pageable);

    Page<SolutionDto> getSolutionsByProblem(String problemId, Pageable pageable);

    Page<SolutionDto> getSolutionsByUser(String userId, Pageable pageable);

    SolutionDto voteSolution(String id, String userId, boolean isUpvote);
}