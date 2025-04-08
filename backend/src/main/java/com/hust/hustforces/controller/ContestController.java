package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.service.ContestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/contests")
@RequiredArgsConstructor
@Slf4j
public class ContestController {

    private final ContestService contestService;

    /**
     * Creates a new contest. Requires ADMIN role.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContestDetailDto> createContest(@Valid @RequestBody CreateContestRequest request) {
        log.info("Request received to create contest: {}", request.getName());
        ContestDetailDto createdContest = contestService.createContest(request);
        log.info("Contest created successfully with ID: {}", createdContest.getId());
        return new ResponseEntity<>(createdContest, HttpStatus.CREATED);
    }

    /**
     * Retrieves a paginated list of contests (summary view).
     */
    @GetMapping
    public ResponseEntity<Page<ContestSummaryDto>> getAllContests(Pageable pageable) {
        log.info("Request received to list contests");
        Page<ContestSummaryDto> contests = contestService.getAllContests(pageable);
        return ResponseEntity.ok(contests);
    }

    /**
     * Retrieves detailed information about a specific contest.
     * Access control might be needed in the service layer (e.g., based on registration/timing).
     */
    @GetMapping("/{contestId}")
    public ResponseEntity<ContestDetailDto> getContestDetails(@PathVariable String contestId) {
        log.info("Request received for details of contest ID: {}", contestId);
        ContestDetailDto contest = contestService.getContestDetails(contestId);
        return ResponseEntity.ok(contest);
    }

    /**
     * Updates an existing contest. Requires ADMIN role.
     */
    @PutMapping("/{contestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContestDetailDto> updateContest(@PathVariable String contestId, @Valid @RequestBody UpdateContestRequest request) {
        log.info("Request received to update contest ID: {}", contestId);
        ContestDetailDto updatedContest = contestService.updateContest(contestId, request);
        log.info("Contest ID: {} updated successfully", contestId);
        return ResponseEntity.ok(updatedContest);
    }

    /**
     * Deletes a contest. Requires ADMIN role.
     */
    @DeleteMapping("/{contestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContest(@PathVariable String contestId) {
        log.info("Request received to delete contest ID: {}", contestId);
        contestService.deleteContest(contestId);
        log.info("Contest ID: {} deleted successfully", contestId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Registers the currently authenticated user for a contest.
     */
    @PostMapping("/{contestId}/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> registerForContest(@PathVariable String contestId) {
        log.info("Request received for user registration to contest ID: {}", contestId);
        contestService.registerUserForContest(contestId);
        log.info("User registered successfully for contest ID: {}", contestId);
        return ResponseEntity.ok().build();
    }

    /**
     * Retrieves the list of problems associated with a contest.
     * Access control (timing, registration) should be handled in the service.
     */
    @GetMapping("/{contestId}/problems")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ContestProblemDto>> getContestProblems(@PathVariable String contestId) {
        log.info("Request received for problems of contest ID: {}", contestId);
        List<ContestProblemDto> problems = contestService.getContestProblems(contestId);
        return ResponseEntity.ok(problems);
    }

    /**
     * Retrieves the scoreboard for a specific contest.
     * Access control (e.g., visibility during/after contest) should be handled in the service.
     */
    @GetMapping("/{contestId}/scoreboard")
    public ResponseEntity<List<ScoreboardEntryDto>> getScoreboard(@PathVariable String contestId) {
        log.info("Request received for scoreboard of contest ID: {}", contestId);
        List<ScoreboardEntryDto> scoreboard = contestService.getScoreboard(contestId);
        return ResponseEntity.ok(scoreboard);
    }
}
