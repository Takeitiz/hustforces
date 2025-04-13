package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardServiceImpl implements LeaderboardService {

    private final RedisCacheService cacheService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    public int updateUserScore(String contestId, String userId, String problemId, int points, String submissionId) {
        log.info("Updating score for user {} in contest {} for problem {}: {} points",
                userId, contestId, problemId, points);

        // Validate contest exists
        contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Get user details
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Get current score
        Double currentScore = cacheService.getUserScore(contestId, userId);
        int totalPoints = points;

        if (currentScore != null) {
            // Check if user already has points for this problem
            String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
            ProblemSubmissionStatusDto existingStatus = cacheService.getFromHash(
                    userProblemsKey, problemId, ProblemSubmissionStatusDto.class);

            if (existingStatus != null) {
                // Only update if new points are higher
                if (points > existingStatus.getPoints()) {
                    totalPoints = calculateTotalPoints(contestId, userId, problemId, points);
                } else {
                    // No update needed, return current rank
                    return cacheService.getUserRank(contestId, userId);
                }
            } else {
                // First time solving this problem
                totalPoints = calculateTotalPoints(contestId, userId, problemId, points);
            }
        }

        // Update the leaderboard score
        cacheService.updateUserScore(contestId, userId, totalPoints);

        // Update problem status for this user
        updateProblemStatus(contestId, userId, problemId, points, submissionId);

        // Get the new rank
        int newRank = cacheService.getUserRank(contestId, userId);

        // Publish the updated leaderboard to subscribers
        publishLeaderboardUpdate(contestId);

        return newRank;
    }

    @Override
    public List<ContestLeaderboardEntryDto> getLeaderboard(String contestId) {
        log.info("Getting leaderboard for contest {}", contestId);

        contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Get top scores from Redis, ordered by rank (highest score first)
        Set<ZSetOperations.TypedTuple<Object>> rankedScores = cacheService.getContestLeaderboard(contestId);

        if (rankedScores == null || rankedScores.isEmpty()) {
            log.info("No leaderboard data found for contest {}", contestId);
            return new ArrayList<>();
        }

        List<ContestLeaderboardEntryDto> leaderboard = new ArrayList<>();
        AtomicInteger rank = new AtomicInteger(1);

        for (ZSetOperations.TypedTuple<Object> entry : rankedScores) {
            String userId = (String) entry.getValue();
            if (userId == null) continue;

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) continue;

            // Get problem statuses for this user
            Map<String, ProblemSubmissionStatusDto> problemStatuses = getUserProblemStatuses(contestId, userId);

            ContestLeaderboardEntryDto leaderboardEntry = ContestLeaderboardEntryDto.builder()
                    .userId(userId)
                    .username(user.getUsername())
                    .rank(rank.getAndIncrement())
                    .totalPoints(Objects.requireNonNull(entry.getScore()).intValue())
                    .problemStatuses(new ArrayList<>(problemStatuses.values()))
                    .build();

            leaderboard.add(leaderboardEntry);
        }

        return leaderboard;
    }

    @Override
    public ContestLeaderboardEntryDto getUserRanking(String contestId, String userId) {
        log.info("Getting ranking for user {} in contest {}", userId, contestId);

        Double score = cacheService.getUserScore(contestId, userId);

        if (score == null) {
            log.info("No score found for user {} in contest {}", userId, contestId);
            return null;
        }

        int rank = cacheService.getUserRank(contestId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Map<String, ProblemSubmissionStatusDto> problemStatuses = getUserProblemStatuses(contestId, userId);

        return ContestLeaderboardEntryDto.builder()
                .userId(userId)
                .username(user.getUsername())
                .rank(rank)
                .totalPoints(score.intValue())
                .problemStatuses(new ArrayList<>(problemStatuses.values()))
                .build();
    }

    @Override
    public Map<String, ProblemSubmissionStatusDto> getUserProblemStatuses(String contestId, String userId) {
        log.info("Getting problem statuses for user {} in contest {}", userId, contestId);

        String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
        Map<String, ProblemSubmissionStatusDto> problemStatuses =
                cacheService.getAllFromHash(userProblemsKey, ProblemSubmissionStatusDto.class);

        if (problemStatuses.isEmpty()) {
            log.info("No problem data found for user {} in contest {}", userId, contestId);
        }

        return problemStatuses;
    }

    @Override
    public void initializeLeaderboard(String contestId) {
        log.info("Initializing leaderboard for contest {}", contestId);

        // Clear existing data
        cacheService.clearContestData(contestId);

        log.info("Leaderboard initialized for contest {}", contestId);
    }

    @Override
    public void rebuildLeaderboard(String contestId) {
        log.info("Rebuilding leaderboard for contest {}", contestId);

        // Initialize leaderboard (clear existing data)
        initializeLeaderboard(contestId);

        // Get all contest submissions
        List<ContestSubmission> submissions = contestSubmissionRepository.findAllByContestId(contestId);

        // Process each submission
        for (ContestSubmission submission : submissions) {
            updateUserScore(
                    submission.getContestId(),
                    submission.getUserId(),
                    submission.getProblemId(),
                    submission.getPoints(),
                    submission.getSubmissionId()
            );
        }

        // Add attempt counts
        updateAttemptCounts(contestId);

        log.info("Leaderboard rebuilt for contest {}", contestId);

        // Publish the updated leaderboard
        publishLeaderboardUpdate(contestId);
    }

    @Override
    public void incrementAttemptCount(String contestId, String userId, String problemId) {
        log.info("Incrementing attempt count for user {} on problem {} in contest {}",
                userId, problemId, contestId);

        String attemptsKey = cacheService.getProblemAttemptsKey(contestId, userId);
        int newCount = cacheService.incrementHashCounter(attemptsKey, problemId);

        // Update problem status if it exists
        String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
        ProblemSubmissionStatusDto status = cacheService.getFromHash(
                userProblemsKey, problemId, ProblemSubmissionStatusDto.class);

        if (status != null) {
            status.setAttempts(newCount);
            cacheService.storeInHash(userProblemsKey, problemId, status);

            // Publish update to websocket
            publishUserUpdate(contestId, userId);
        } else {
            // Create new problem status entry
            ProblemSubmissionStatusDto newStatus = ProblemSubmissionStatusDto.builder()
                    .problemId(problemId)
                    .points(0)
                    .attempts(newCount)
                    .solved(false)
                    .build();

            cacheService.storeInHash(userProblemsKey, problemId, newStatus);

            // Publish update to websocket
            publishUserUpdate(contestId, userId);
        }
    }

    /**
     * Calculate total points across all problems for a user
     */
    private int calculateTotalPoints(String contestId, String userId, String problemId, int newPoints) {
        // Get all problem statuses
        String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
        Map<String, ProblemSubmissionStatusDto> problemStatuses =
                cacheService.getAllFromHash(userProblemsKey, ProblemSubmissionStatusDto.class);

        int totalPoints = newPoints;

        for (Map.Entry<String, ProblemSubmissionStatusDto> entry : problemStatuses.entrySet()) {
            String pid = entry.getKey();

            // Skip the current problem as we're updating it
            if (pid.equals(problemId)) continue;

            ProblemSubmissionStatusDto status = entry.getValue();
            totalPoints += status.getPoints();
        }

        return totalPoints;
    }

    /**
     * Update problem status in Redis
     */
    private void updateProblemStatus(String contestId, String userId, String problemId,
                                     int points, String submissionId) {

        // Get attempt count
        String attemptsKey = cacheService.getProblemAttemptsKey(contestId, userId);
        String currentCountStr = (String) cacheService.getFromHash(attemptsKey, problemId, String.class);
        int attempts = currentCountStr != null ? Integer.parseInt(currentCountStr) : 1;

        // Create problem status
        ProblemSubmissionStatusDto status = ProblemSubmissionStatusDto.builder()
                .problemId(problemId)
                .points(points)
                .attempts(attempts)
                .submissionId(submissionId)
                .solved(true)
                .build();

        String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
        cacheService.storeInHash(userProblemsKey, problemId, status);
    }

    /**
     * Update attempt counts for all users and problems in a contest
     */
    private void updateAttemptCounts(String contestId) {
        List<Submission> allSubmissions = submissionRepository.findByActiveContestId(contestId);
        Map<String, Map<String, Integer>> attemptCounts = new HashMap<>();

        // Count attempts
        for (Submission submission : allSubmissions) {
            String userId = submission.getUserId();
            String problemId = submission.getProblemId();

            attemptCounts
                    .computeIfAbsent(userId, k -> new HashMap<>())
                    .compute(problemId, (k, v) -> v == null ? 1 : v + 1);
        }

        // Update Redis
        for (Map.Entry<String, Map<String, Integer>> userEntry : attemptCounts.entrySet()) {
            String userId = userEntry.getKey();

            for (Map.Entry<String, Integer> problemEntry : userEntry.getValue().entrySet()) {
                String problemId = problemEntry.getKey();
                int attempts = problemEntry.getValue();

                // Store attempt count
                String attemptsKey = cacheService.getProblemAttemptsKey(contestId, userId);
                cacheService.storeInHash(attemptsKey, problemId, String.valueOf(attempts));

                // Update problem status if it exists
                String userProblemsKey = cacheService.getUserProblemsKey(contestId, userId);
                ProblemSubmissionStatusDto status = cacheService.getFromHash(
                        userProblemsKey, problemId, ProblemSubmissionStatusDto.class);

                if (status != null) {
                    status.setAttempts(attempts);
                    cacheService.storeInHash(userProblemsKey, problemId, status);
                }
            }
        }
    }

    /**
     * Publish leaderboard update via WebSocket
     */
    private void publishLeaderboardUpdate(String contestId) {
        List<ContestLeaderboardEntryDto> leaderboard = getLeaderboard(contestId);
        messagingTemplate.convertAndSend("/topic/contest/" + contestId + "/leaderboard", leaderboard);
    }

    /**
     * Publish user update via WebSocket
     */
    private void publishUserUpdate(String contestId, String userId) {
        ContestLeaderboardEntryDto userRanking = getUserRanking(contestId, userId);
        messagingTemplate.convertAndSend(
                "/topic/contest/" + contestId + "/user/" + userId,
                userRanking
        );
    }
}
