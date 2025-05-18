package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.contest.ContestDto;
import com.hust.hustforces.model.dto.contest.CreateContestRequest;
import com.hust.hustforces.model.dto.contest.UpdateContestRequest;
import com.hust.hustforces.service.ContestService;
import com.hust.hustforces.service.LeaderboardService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/admin/contests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminContestController {
    private final ContestService contestService;
    private final LeaderboardService leaderboardService;
    private final CurrentUserUtil currentUserUtil;

    @GetMapping
    public ResponseEntity<Page<ContestDto>> getAllContests(
            @PageableDefault(size = 10, sort = "startTime") Pageable pageable) {
        Page<ContestDto> contests = contestService.getAllContests(pageable);
        return ResponseEntity.ok(contests);
    }

    @PostMapping
    public ResponseEntity<ContestDto> createContest(@Valid @RequestBody CreateContestRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestDto contest = contestService.createContest(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(contest);
    }

    @PutMapping("/{contestId}")
    public ResponseEntity<ContestDto> updateContest(
            @PathVariable String contestId,
            @Valid @RequestBody UpdateContestRequest request) {
        String userId = currentUserUtil.getCurrentUserId();
        ContestDto contest = contestService.updateContest(contestId, request, userId);
        return ResponseEntity.ok(contest);
    }

    @DeleteMapping("/{contestId}")
    public ResponseEntity<Void> deleteContest(@PathVariable String contestId) {
        String userId = currentUserUtil.getCurrentUserId();
        contestService.deleteContest(contestId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contestId}/problems")
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
    public ResponseEntity<Void> removeProblemFromContest(
            @PathVariable String contestId,
            @PathVariable String problemId) {
        String userId = currentUserUtil.getCurrentUserId();
        contestService.removeProblemFromContest(contestId, problemId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contestId}/updateLeaderboard")
    public ResponseEntity<Void> updateLeaderboard(@PathVariable String contestId) {
        contestService.updateLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{contestId}/leaderboard/initialize")
    public ResponseEntity<Void> initializeLeaderboard(@PathVariable String contestId) {
        log.info("Initializing leaderboard for contest: {}", contestId);
        leaderboardService.initializeLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{contestId}/leaderboard/rebuild")
    public ResponseEntity<Void> rebuildLeaderboard(@PathVariable String contestId) {
        log.info("Rebuilding leaderboard for contest: {}", contestId);
        leaderboardService.rebuildLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }
}
