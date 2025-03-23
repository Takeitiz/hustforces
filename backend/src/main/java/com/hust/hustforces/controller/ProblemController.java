package com.hust.hustforces.controller;

import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.service.ProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/problems")
@RequiredArgsConstructor
@Slf4j
public class ProblemController {
    private final ProblemService problemService;

    @GetMapping("/{problemId}")
    public ResponseEntity<Problem> getProblem(@PathVariable String problemId, @RequestParam(required = false) String contestId) {
        log.info("Received request to get problem with id: {}, contest context: {}", problemId, (contestId != null ? contestId : "none"));

        Problem problem = problemService.getProblem(problemId, contestId);

        if (problem == null) {
            log.warn("No problem found for id: {} and contestId: {}", problemId, (contestId != null ? contestId : "none"));
            return ResponseEntity.notFound().build();
        }

        log.info("Successfully retrieved problem: {}", problemId);
        return ResponseEntity.ok(problem);
    }

    @GetMapping
    public ResponseEntity<List<Problem>> getAllProblems() {
        log.info("Received request to get all visible problems");

        List<Problem> problems = problemService.getProblems();

        log.info("Returning {} problems", problems.size());
        return ResponseEntity.ok(problems);
    }
}
