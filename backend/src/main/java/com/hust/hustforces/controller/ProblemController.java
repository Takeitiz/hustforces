package com.hust.hustforces.controller;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.model.dto.admin.TestcaseDto;
import com.hust.hustforces.model.dto.problem.ProblemDetailDto;
import com.hust.hustforces.model.dto.problem.ProblemDto;
import com.hust.hustforces.service.ProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemController {
    private final ProblemService problemService;

    @GetMapping("/by-slug/{slug}")
    public ResponseEntity<ProblemDetailDto> getProblemBySlug(
            @PathVariable String slug,
            @RequestParam(required = false) String contestId) {
        log.info("Received request to get problem with slug: {}, contest context: {}",
                slug, (contestId != null ? contestId : "none"));

        ProblemDetailDto problemDto = problemService.getProblemDetailBySlug(slug, contestId);

        if (problemDto == null) {
            log.warn("No problem found for slug: {} and contestId: {}",
                    slug, (contestId != null ? contestId : "none"));
            return ResponseEntity.notFound().build();
        }

        log.info("Successfully retrieved problem: {}", slug);
        return ResponseEntity.ok(problemDto);
    }

    @GetMapping
    public ResponseEntity<Page<ProblemDto>> getAllProblems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Difficulty difficulty,
            @PageableDefault(size = 20, sort = "createdAt,desc") Pageable pageable) {

        log.info("Received request to get problems - search: {}, difficulty: {}, page: {}, size: {}",
                search, difficulty, pageable.getPageNumber(), pageable.getPageSize());

        Page<ProblemDto> problems;

        if (search != null || difficulty != null) {
            problems = problemService.searchProblems(search, difficulty, pageable);
        } else {
            problems = problemService.getProblems(pageable);
        }

        log.info("Returning page {} with {} problems out of {} total",
                pageable.getPageNumber(),
                problems.getNumberOfElements(),
                problems.getTotalElements());

        return ResponseEntity.ok(problems);
    }

    @GetMapping("/{slug}/examples")
    public ResponseEntity<List<TestcaseDto>> getProblemExamples(@PathVariable String slug) {
        log.info("Fetching example test cases for problem: {}", slug);

        // Get only the first 3 test cases as examples
        List<TestcaseDto> examples = problemService.getProblemExampleTestcases(slug, 3);

        if (examples.isEmpty()) {
            log.info("No examples found for problem: {}", slug);
        }

        return ResponseEntity.ok(examples);
    }
}