package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.service.ContestService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
@Slf4j
public class ContestController {
    private final ContestService contestService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContestDto> createContest(@Valid @RequestBody CreateContestRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestDto contest = contestService.createContest(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(contest);
    }

    @PutMapping("/{contestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContestDto> updateContest(
            @PathVariable String contestId,
            @Valid @RequestBody UpdateContestRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestDto contest = contestService.updateContest(contestId, request, userId);
        return ResponseEntity.ok(contest);
    }

    @DeleteMapping("/{contestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteContest(@PathVariable String contestId) {
        String userId = currentUserUtil.getCurrentUserId();
        contestService.deleteContest(contestId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{contestId}")
    public ResponseEntity<ContestDetailDto> getContestDetails(@PathVariable String contestId) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestDetailDto contest = contestService.getContestDetails(contestId, userId);
        return ResponseEntity.ok(contest);
    }

    @GetMapping
    public ResponseEntity<Page<ContestDto>> getAllContests(
            @PageableDefault(size = 10, sort = "startTime") Pageable pageable) {
        Page<ContestDto> contests = contestService.getAllContests(pageable);
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/active")
    public ResponseEntity<List<ContestDto>> getActiveContests() {
        List<ContestDto> contests = contestService.getActiveContests();
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<ContestDto>> getUpcomingContests() {
        List<ContestDto> contests = contestService.getUpcomingContests();
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/past")
    public ResponseEntity<Page<ContestDto>> getPastContests(
            @PageableDefault(size = 10, sort = "endTime") Pageable pageable) {
        Page<ContestDto> contests = contestService.getPastContests(pageable);
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ContestDto>> searchContests(
            @RequestParam String query,
            @PageableDefault(size = 10, sort = "startTime") Pageable pageable) {
        Page<ContestDto> contests = contestService.searchContests(query, pageable);
        return ResponseEntity.ok(contests);
    }

    @PostMapping("/{contestId}/register")
    public ResponseEntity<ContestRegistrationDto> registerForContest(@PathVariable String contestId) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestRegistrationDto registration = contestService.registerForContest(contestId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(registration);
    }

    @PostMapping("/{contestId}/problems")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addProblemToContest(
            @PathVariable String contestId,
            @RequestBody Map<String, Object> request) {
        String userId = currentUserUtil.getCurrentUserId();
        String problemId = (String) request.get("problemId");
        int index = Integer.parseInt(request.get("index").toString());

        contestService.addProblemToContest(contestId, problemId, index, userId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{contestId}/problems/{problemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeProblemFromContest(
            @PathVariable String contestId,
            @PathVariable String problemId) {
        String userId = currentUserUtil.getCurrentUserId();
        contestService.removeProblemFromContest(contestId, problemId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contestId}/updateLeaderboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateLeaderboard(@PathVariable String contestId) {
        contestService.updateLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }
}
