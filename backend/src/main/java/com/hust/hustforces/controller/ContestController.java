package com.hust.hustforces.controller;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.ContestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
@Slf4j
public class ContestController {
    private final ContestService contestService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ContestDto> createContest(@Valid @RequestBody CreateContestRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ContestDto contest = contestService.createContest(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(contest);
    }

    @PutMapping("/{contestId}")
    public ResponseEntity<ContestDto> updateContest(
            @PathVariable String contestId,
            @Valid @RequestBody UpdateContestRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ContestDto contest = contestService.updateContest(contestId, request, user.getId());
        return ResponseEntity.ok(contest);
    }

    @DeleteMapping("/{contestId}")
    public ResponseEntity<Void> deleteContest(@PathVariable String contestId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        contestService.deleteContest(contestId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{contestId}")
    public ResponseEntity<ContestDetailDto> getContestDetails(@PathVariable String contestId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ContestDetailDto contest = contestService.getContestDetails(contestId, user.getId());
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        ContestRegistrationDto registration = contestService.registerForContest(contestId, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(registration);
    }

    @PostMapping("/{contestId}/problems")
    public ResponseEntity<Void> addProblemToContest(
            @PathVariable String contestId,
            @RequestBody Map<String, Object> request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        String problemId = (String) request.get("problemId");
        int index = Integer.parseInt(request.get("index").toString());

        contestService.addProblemToContest(contestId, problemId, index, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{contestId}/problems/{problemId}")
    public ResponseEntity<Void> removeProblemFromContest(
            @PathVariable String contestId,
            @PathVariable String problemId) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        contestService.removeProblemFromContest(contestId, problemId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contestId}/updateLeaderboard")
    public ResponseEntity<Void> updateLeaderboard(@PathVariable String contestId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        contestService.updateLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }
}
