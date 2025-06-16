package com.hust.hustforces.controller;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.ContestMapper;
import com.hust.hustforces.model.dto.contest.ContestDto;
import com.hust.hustforces.model.dto.contest.ContestProblemInfoDto;
import com.hust.hustforces.model.dto.contest.CreateContestRequest;
import com.hust.hustforces.model.dto.contest.UpdateContestRequest;
import com.hust.hustforces.model.entity.Contest;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.ContestProblemRepository;
import com.hust.hustforces.repository.ContestRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.service.ContestService;
import com.hust.hustforces.service.impl.ContestFinalizationService;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/contests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminContestController {
    private final ContestService contestService;
    private final CurrentUserUtil currentUserUtil;
    private final ContestFinalizationService finalizationService;
    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ProblemRepository problemRepository;
    private final ContestMapper contestMapper;

    @GetMapping
    public ResponseEntity<Page<ContestDto>> getAllContests(
            @PageableDefault(size = 10, sort = "startTime") Pageable pageable) {
        Page<ContestDto> contests = contestService.getAllContests(pageable);
        return ResponseEntity.ok(contests);
    }

    @GetMapping("/{contestId}")
    public ResponseEntity<ContestDto> getContest(@PathVariable String contestId) {
        log.info("Admin fetching contest with id: {}", contestId);

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        List<ContestProblemInfoDto> problemInfoDtos = contestProblemRepository
                .findByContestIdOrderByIndex(contestId)
                .stream()
                .map(cp -> {
                    Problem problem = problemRepository.findById(cp.getProblemId())
                            .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                    return ContestProblemInfoDto.builder()
                            .id(cp.getId())
                            .problemId(problem.getId())
                            .title(problem.getTitle())
                            .index(cp.getIndex())
                            .solved(cp.getSolved())
                            .build();
                })
                .collect(Collectors.toList());

        ContestDto contestDto = contestMapper.toContestDto(contest, problemInfoDtos);

        return ResponseEntity.ok(contestDto);
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

    /**
     * Manually finalize a contest
     */
    @PostMapping("/{contestId}/finalize")
    public ResponseEntity<Map<String, String>> finalizeContest(@PathVariable String contestId) {
        log.info("Admin request to finalize contest: {}", contestId);

        try {
            finalizationService.manuallyFinalizeContest(contestId);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Contest finalized successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error finalizing contest {}: {}", contestId, e.getMessage());

            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }
}
