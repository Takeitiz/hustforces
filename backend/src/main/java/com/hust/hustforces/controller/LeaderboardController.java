package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.LeaderboardPageDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.service.LeaderboardService;
import com.hust.hustforces.utils.CurrentUserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboards")
@RequiredArgsConstructor
@Slf4j
public class LeaderboardController {
    private final LeaderboardService leaderboardService;
    private final CurrentUserUtil currentUserUtil;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/contest/{contestId}")
    public ResponseEntity<List<ContestLeaderboardEntryDto>> getContestLeaderboard(
            @PathVariable String contestId,
            @RequestParam(required = false, defaultValue = "false") boolean full) {
        log.info("Fetching leaderboard for contest: {}", contestId);
        List<ContestLeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(contestId);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/contest/{contestId}/page")
    public ResponseEntity<LeaderboardPageDto> getPaginatedLeaderboard(
            @PathVariable String contestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching paginated leaderboard for contest: {}, page: {}, size: {}",
                contestId, page, size);
        LeaderboardPageDto leaderboard = leaderboardService.getLeaderboardPage(contestId, page, size);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/contest/{contestId}/user")
    public ResponseEntity<ContestLeaderboardEntryDto> getCurrentUserRanking(@PathVariable String contestId) {
        String userId = currentUserUtil.getCurrentUserId();
        log.info("Fetching ranking for current user in contest: {}", contestId);
        ContestLeaderboardEntryDto ranking = leaderboardService.getUserRanking(contestId, userId);
        return ResponseEntity.ok(ranking);
    }

    @GetMapping("/contest/{contestId}/user/{userId}")
    public ResponseEntity<ContestLeaderboardEntryDto> getUserRanking(
            @PathVariable String contestId,
            @PathVariable String userId) {
        log.info("Fetching ranking for user: {} in contest: {}", userId, contestId);
        ContestLeaderboardEntryDto ranking = leaderboardService.getUserRanking(contestId, userId);
        return ResponseEntity.ok(ranking);
    }

    @GetMapping("/contest/{contestId}/user/{userId}/problems")
    public ResponseEntity<Map<String, ProblemSubmissionStatusDto>> getUserProblemStatuses(
            @PathVariable String contestId,
            @PathVariable String userId) {
        log.info("Fetching problem statuses for user: {} in contest: {}", userId, contestId);
        Map<String, ProblemSubmissionStatusDto> statuses = leaderboardService.getUserProblemStatuses(contestId, userId);
        return ResponseEntity.ok(statuses);
    }

    @PostMapping("/contest/{contestId}/initialize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> initializeLeaderboard(@PathVariable String contestId) {
        log.info("Initializing leaderboard for contest: {}", contestId);
        leaderboardService.initializeLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contest/{contestId}/rebuild")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> rebuildLeaderboard(@PathVariable String contestId) {
        log.info("Rebuilding leaderboard for contest: {}", contestId);
        leaderboardService.rebuildLeaderboard(contestId);
        return ResponseEntity.ok().build();
    }

    // WebSocket methods to subscribe to leaderboard updates
    @MessageMapping("/contest/{contestId}/subscribe")
    public void subscribeToContestLeaderboard(@DestinationVariable String contestId) {
        log.info("Received subscription request for contest: {}", contestId);
        // Send the current leaderboard to the new subscriber
        List<ContestLeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(contestId);
        messagingTemplate.convertAndSend("/topic/contest/" + contestId + "/leaderboard", leaderboard);
    }

    @MessageMapping("/contest/{contestId}/user/{userId}/subscribe")
    public void subscribeToUserUpdates(
            @DestinationVariable String contestId,
            @DestinationVariable String userId) {

        log.info("Received user subscription request for user: {} in contest: {}", userId, contestId);
        // Send the current user ranking to the new subscriber
        ContestLeaderboardEntryDto ranking = leaderboardService.getUserRanking(contestId, userId);
        messagingTemplate.convertAndSend("/topic/contest/" + contestId + "/user/" + userId, ranking);
    }
}
