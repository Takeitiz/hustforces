package com.hust.hustforces.controller;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.discussion.SolutionDetailDto;
import com.hust.hustforces.model.dto.discussion.SolutionDto;
import com.hust.hustforces.service.SolutionService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/solutions")
@RequiredArgsConstructor
@Slf4j
public class SolutionController {
    private final SolutionService solutionService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    public ResponseEntity<SolutionDto> createSolution(@Valid @RequestBody Map<String, String> request) {
        String userId = currentUserUtil.getCurrentUserId();

        String code = request.get("code");
        String description = request.get("description");
        String problemId = request.get("problemId");
        LanguageId languageId = LanguageId.valueOf(request.get("languageId"));

        SolutionDto solution = solutionService.createSolution(
                code,
                description,
                userId,
                problemId,
                languageId
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(solution);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SolutionDetailDto> getSolution(@PathVariable String id) {
        String userId = currentUserUtil.getCurrentUserId();
        SolutionDetailDto solution = solutionService.getSolution(id, userId);
        return ResponseEntity.ok(solution);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SolutionDto> updateSolution(
            @PathVariable String id,
            @Valid @RequestBody Map<String, String> request
    ) {
        String userId = currentUserUtil.getCurrentUserId();

        String code = request.get("code");
        String description = request.get("description");

        SolutionDto solution = solutionService.updateSolution(
                id,
                code,
                description,
                userId
        );

        return ResponseEntity.ok(solution);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSolution(@PathVariable String id) {
        String userId = currentUserUtil.getCurrentUserId();
        solutionService.deleteSolution(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<SolutionDto>> getAllSolutions(
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getAllSolutions(pageable);
        return ResponseEntity.ok(solutions);
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<Page<SolutionDto>> getSolutionsByProblem(
            @PathVariable String problemId,
            @PageableDefault(size = 10, sort = "upvotes") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getSolutionsByProblem(problemId, pageable);
        return ResponseEntity.ok(solutions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<SolutionDto>> getSolutionsByUser(
            @PathVariable String userId,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        Page<SolutionDto> solutions = solutionService.getSolutionsByUser(userId, pageable);
        return ResponseEntity.ok(solutions);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<SolutionDto> voteSolution(
            @PathVariable String id,
            @RequestParam boolean upvote
    ) {
        String userId = currentUserUtil.getCurrentUserId();
        SolutionDto solution = solutionService.voteSolution(id, userId, upvote);
        return ResponseEntity.ok(solution);
    }
}