package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardServiceImpl implements LeaderboardService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    private static final String CONTEST_SCORES_PREFIX = "contest:scores:";
    private static final String USER_PROBLEMS_PREFIX = "user:problems:";
    private static final String PROBLEM_ATTEMPTS_PREFIX = "problem:attempts:";

    @Override
    public int updateUserScore(String contestId, String userId, String problemId, int points, String submissionId) {
        log.info("Updating score for user {} in contest {} for problem {}: {} points",
                userId, contestId, problemId, points);

        // Validate contest exists
        contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Update redis score
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        Double currentScore = redisTemplate.opsForZSet().score(scoresKey, userId);
        int totalPoints = points;

        if (currentScore != null) {
            // Check if user already has points for this problem
            String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
            String problemData = (String) redisTemplate.opsForHash().get(userProblemsKey, problemId);

            if (problemData != null) {
                try {
                    ProblemSubmissionStatusDto existingStatus = objectMapper.readValue(
                            problemData, ProblemSubmissionStatusDto.class);

                    // Only update if new points are higher
                    if (points > existingStatus.getPoints()) {
                        totalPoints = calculateTotalPoints(contestId, userId, problemId, points);
                    } else {
                        // No update needed, return current rank
                        return getCurrentRank(scoresKey, userId);
                    }
                } catch (JsonProcessingException e) {
                    log.error("Error parsing problem data from Redis", e);
                }
            } else {
                // First time solving this problem
                totalPoints = calculateTotalPoints(contestId, userId, problemId, points);
            }
        }

        // Update the leaderboard score
        redisTemplate.opsForZSet().add(scoresKey, userId, totalPoints);

        // Update problem status for this user
        updateProblemStatus(contestId, userId, problemId, points, submissionId);

        // Get the new rank
        int newRank = getCurrentRank(scoresKey, userId);

        // Publish the updated leaderboard to subscribers
        publishLeaderboardUpdate(contestId);

        return newRank;
    }

    @Override
    public List<ContestLeaderboardEntryDto> getLeaderboard(String contestId) {
        log.info("Getting leaderboard for contest {}", contestId);

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        String scoresKey = CONTEST_SCORES_PREFIX + contestId;

        // Get top scores from Redis, ordered by rank (highest score first)
        Set<ZSetOperations.TypedTuple<Object>> rankedScores =
                redisTemplate.opsForZSet().reverseRangeWithScores(scoresKey, 0, -1);

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
                    .totalPoints(entry.getScore().intValue())
                    .problemStatuses(new ArrayList<>(problemStatuses.values()))
                    .build();

            leaderboard.add(leaderboardEntry);
        }

        return leaderboard;
    }

    @Override
    public ContestLeaderboardEntryDto getUserRanking(String contestId, String userId) {
        log.info("Getting ranking for user {} in contest {}", userId, contestId);

        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        Double score = redisTemplate.opsForZSet().score(scoresKey, userId);

        if (score == null) {
            log.info("No score found for user {} in contest {}", userId, contestId);
            return null;
        }

        int rank = getCurrentRank(scoresKey, userId);
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

        String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
        Map<Object, Object> problemData = redisTemplate.opsForHash().entries(userProblemsKey);

        if (problemData.isEmpty()) {
            log.info("No problem data found for user {} in contest {}", userId, contestId);
            return new HashMap<>();
        }

        Map<String, ProblemSubmissionStatusDto> problemStatuses = new HashMap<>();

        for (Map.Entry<Object, Object> entry : problemData.entrySet()) {
            String problemId = (String) entry.getKey();
            String statusJson = (String) entry.getValue();

            try {
                ProblemSubmissionStatusDto status = objectMapper.readValue(
                        statusJson, ProblemSubmissionStatusDto.class);
                problemStatuses.put(problemId, status);
            } catch (JsonProcessingException e) {
                log.error("Error parsing problem status JSON for problem {}", problemId, e);
            }
        }

        return problemStatuses;
    }

    @Override
    public void initializeLeaderboard(String contestId) {
        log.info("Initializing leaderboard for contest {}", contestId);

        // Clear existing data
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        redisTemplate.delete(scoresKey);

        // Delete all user problem data for this contest
        Set<String> userProblemKeys = redisTemplate.keys(USER_PROBLEMS_PREFIX + contestId + ":*");
        if (userProblemKeys != null && !userProblemKeys.isEmpty()) {
            redisTemplate.delete(userProblemKeys);
        }

        // Delete all problem attempt data for this contest
        Set<String> problemAttemptKeys = redisTemplate.keys(PROBLEM_ATTEMPTS_PREFIX + contestId + ":*");
        if (problemAttemptKeys != null && !problemAttemptKeys.isEmpty()) {
            redisTemplate.delete(problemAttemptKeys);
        }

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
        List<Submission> allSubmissions = submissionRepository.findByActiveContestId(contestId);
        Map<String, Map<String, Integer>> attemptCounts = new HashMap<>();

        for (Submission submission : allSubmissions) {
            String userId = submission.getUserId();
            String problemId = submission.getProblemId();

            attemptCounts
                    .computeIfAbsent(userId, k -> new HashMap<>())
                    .compute(problemId, (k, v) -> v == null ? 1 : v + 1);
        }

        // Update attempt counts in Redis
        for (Map.Entry<String, Map<String, Integer>> userEntry : attemptCounts.entrySet()) {
            String userId = userEntry.getKey();

            for (Map.Entry<String, Integer> problemEntry : userEntry.getValue().entrySet()) {
                String problemId = problemEntry.getKey();
                int attempts = problemEntry.getValue();

                String attemptsKey = PROBLEM_ATTEMPTS_PREFIX + contestId + ":" + userId;
                redisTemplate.opsForHash().put(attemptsKey, problemId, String.valueOf(attempts));

                // Update problem status if it exists
                String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
                String problemData = (String) redisTemplate.opsForHash().get(userProblemsKey, problemId);

                if (problemData != null) {
                    try {
                        ProblemSubmissionStatusDto status = objectMapper.readValue(
                                problemData, ProblemSubmissionStatusDto.class);

                        status.setAttempts(attempts);

                        redisTemplate.opsForHash().put(
                                userProblemsKey,
                                problemId,
                                objectMapper.writeValueAsString(status)
                        );
                    } catch (JsonProcessingException e) {
                        log.error("Error updating attempt count for problem {}", problemId, e);
                    }
                }
            }
        }

        log.info("Leaderboard rebuilt for contest {}", contestId);

        // Publish the updated leaderboard
        publishLeaderboardUpdate(contestId);
    }

    @Override
    public void incrementAttemptCount(String contestId, String userId, String problemId) {
        log.info("Incrementing attempt count for user {} on problem {} in contest {}",
                userId, problemId, contestId);

        String attemptsKey = PROBLEM_ATTEMPTS_PREFIX + contestId + ":" + userId;
        String currentCountStr = (String) redisTemplate.opsForHash().get(attemptsKey, problemId);
        int currentCount = currentCountStr != null ? Integer.parseInt(currentCountStr) : 0;
        int newCount = currentCount + 1;

        // Update attempt count
        redisTemplate.opsForHash().put(attemptsKey, problemId, String.valueOf(newCount));

        // Update problem status if it exists
        String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
        String problemData = (String) redisTemplate.opsForHash().get(userProblemsKey, problemId);

        if (problemData != null) {
            try {
                ProblemSubmissionStatusDto status = objectMapper.readValue(
                        problemData, ProblemSubmissionStatusDto.class);

                status.setAttempts(newCount);

                redisTemplate.opsForHash().put(
                        userProblemsKey,
                        problemId,
                        objectMapper.writeValueAsString(status)
                );

                // Publish update to websocket
                publishUserUpdate(contestId, userId);
            } catch (JsonProcessingException e) {
                log.error("Error updating attempt count for problem {}", problemId, e);
            }
        } else {
            // Create new problem status entry
            ProblemSubmissionStatusDto newStatus = ProblemSubmissionStatusDto.builder()
                    .problemId(problemId)
                    .points(0)
                    .attempts(newCount)
                    .solved(false)
                    .build();

            try {
                redisTemplate.opsForHash().put(
                        userProblemsKey,
                        problemId,
                        objectMapper.writeValueAsString(newStatus)
                );

                // Publish update to websocket
                publishUserUpdate(contestId, userId);
            } catch (JsonProcessingException e) {
                log.error("Error creating problem status for problem {}", problemId, e);
            }
        }
    }

    private int calculateTotalPoints(String contestId, String userId, String problemId, int newPoints) {
        // Get all problem statuses
        String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
        Map<Object, Object> problemData = redisTemplate.opsForHash().entries(userProblemsKey);

        int totalPoints = newPoints;

        for (Map.Entry<Object, Object> entry : problemData.entrySet()) {
            String pid = (String) entry.getKey();

            // Skip the current problem as we're updating it
            if (pid.equals(problemId)) continue;

            String statusJson = (String) entry.getValue();

            try {
                ProblemSubmissionStatusDto status = objectMapper.readValue(
                        statusJson, ProblemSubmissionStatusDto.class);
                totalPoints += status.getPoints();
            } catch (JsonProcessingException e) {
                log.error("Error parsing problem status for problem {}", pid, e);
            }
        }

        return totalPoints;
    }

    private void updateProblemStatus(String contestId, String userId, String problemId,
                                     int points, String submissionId) {

        // Get attempt count
        String attemptsKey = PROBLEM_ATTEMPTS_PREFIX + contestId + ":" + userId;
        String currentCountStr = (String) redisTemplate.opsForHash().get(attemptsKey, problemId);
        int attempts = currentCountStr != null ? Integer.parseInt(currentCountStr) : 1;

        // Create problem status
        ProblemSubmissionStatusDto status = ProblemSubmissionStatusDto.builder()
                .problemId(problemId)
                .points(points)
                .attempts(attempts)
                .submissionId(submissionId)
                .solved(true)
                .build();

        try {
            String userProblemsKey = USER_PROBLEMS_PREFIX + contestId + ":" + userId;
            redisTemplate.opsForHash().put(
                    userProblemsKey,
                    problemId,
                    objectMapper.writeValueAsString(status)
            );
        } catch (JsonProcessingException e) {
            log.error("Error serializing problem status", e);
        }
    }

    private int getCurrentRank(String scoresKey, String userId) {
        // Get user's score
        Double score = redisTemplate.opsForZSet().score(scoresKey, userId);
        if (score == null) return 0;

        // Count users with higher score (reverse order for leaderboard)
        Long higherScores = redisTemplate.opsForZSet().reverseRank(scoresKey, userId);
        return higherScores != null ? higherScores.intValue() + 1 : 0;
    }

    private void publishLeaderboardUpdate(String contestId) {
        List<ContestLeaderboardEntryDto> leaderboard = getLeaderboard(contestId);
        messagingTemplate.convertAndSend("/topic/contest/" + contestId + "/leaderboard", leaderboard);
    }

    private void publishUserUpdate(String contestId, String userId) {
        ContestLeaderboardEntryDto userRanking = getUserRanking(contestId, userId);
        messagingTemplate.convertAndSend(
                "/topic/contest/" + contestId + "/user/" + userId,
                userRanking
        );
    }
}
