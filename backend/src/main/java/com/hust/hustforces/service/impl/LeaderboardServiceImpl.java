package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.LeaderboardPageDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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
    private final ObjectMapper objectMapper;
    private final ContestPointsRepository contestPointsRepository;

    // Cache for pending score updates to be processed in batch
    private final Map<String, Map<String, Double>> pendingScoreUpdates = new ConcurrentHashMap<>();

    /**
     * Scheduled task to process pending score updates in batch
     */
    @Scheduled(fixedRate = 5000)  // Process every 5 seconds
    public void processPendingScoreUpdates() {
        if (pendingScoreUpdates.isEmpty()) {
            return;
        }

        log.debug("Processing pending score updates for {} contests", pendingScoreUpdates.size());

        // Process each contest's updates
        for (Iterator<Map.Entry<String, Map<String, Double>>> it = pendingScoreUpdates.entrySet().iterator(); it.hasNext(); ) {
            Map.Entry<String, Map<String, Double>> entry = it.next();
            String contestId = entry.getKey();
            Map<String, Double> userScores = entry.getValue();

            // Process in batch
            try {
                cacheService.batchUpdateScores(contestId, userScores);

                // Publish update (we'll optimize this later to not publish on every batch)
                publishLeaderboardUpdate(contestId);

                // Remove from pending updates
                it.remove();
            } catch (Exception e) {
                log.error("Error processing batch updates for contest {}: {}", contestId, e.getMessage(), e);
                // Keep in the queue for retry
            }
        }
    }

    @Override
    public int updateUserScore(String contestId, String userId, String problemId, int points, String submissionId) {
        log.info("Updating score for user {} in contest {} for problem {}: {} points",
                userId, contestId, problemId, points);

        // Check if contest is already finalized
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        if (contest.isFinalized()) {
            log.warn("Attempt to update score for finalized contest {}", contestId);
            throw new IllegalStateException("Cannot update scores for finalized contest");
        }

        // Get user details
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if contest is completed and cached
        if (cacheService.isContestCompleted(contestId)) {
            log.debug("Contest {} is completed, skipping score update for finished contest", contestId);
            return cacheService.getUserRank(contestId, userId);
        }

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

        // Update score directly in Redis (no more queueing)
        cacheService.updateUserScore(contestId, userId, totalPoints);

        // Update problem status for this user
        updateProblemStatus(contestId, userId, problemId, points, submissionId);

        // Get the new rank
        int newRank = cacheService.getUserRank(contestId, userId);

        // Publish updates
        publishUserUpdate(contestId, userId);
        publishLeaderboardUpdate(contestId);

        updateDatabaseScore(contestId, userId, totalPoints, problemId);
        return newRank;
    }

    @Override
    public LeaderboardPageDto getLeaderboardPage(String contestId, int page, int size) {
        log.info("Getting paginated leaderboard for contest {}, page {}, size {}", contestId, page, size);

        contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Check if contest is completed and has cached standings
        if (cacheService.isContestCompleted(contestId)) {
            String cachedStandings = cacheService.getContestStandings(contestId);
            if (cachedStandings != null) {
                try {
                    LeaderboardPageDto standings = objectMapper.readValue(cachedStandings, LeaderboardPageDto.class);

                    // Filter for the requested page
                    int totalItems = standings.getTotalItems();
                    List<ContestLeaderboardEntryDto> entries = standings.getEntries();
                    int startIdx = page * size;
                    int endIdx = Math.min(startIdx + size, entries.size());

                    if (startIdx < entries.size()) {
                        List<ContestLeaderboardEntryDto> pageEntries = entries.subList(startIdx, endIdx);
                        return new LeaderboardPageDto(pageEntries, page, size, totalItems);
                    }
                } catch (JsonProcessingException e) {
                    log.error("Error deserializing cached standings: {}", e.getMessage(), e);
                    // Fall back to generating from Redis
                }
            }
        }

        // Get top scores for the requested page from Redis
        Set<ZSetOperations.TypedTuple<Object>> rankedScores = cacheService.getPaginatedLeaderboard(contestId, page, size);
        long totalItems = cacheService.getLeaderboardSize(contestId);

        if (rankedScores == null || rankedScores.isEmpty()) {
            log.info("No leaderboard data found for contest {} on page {}", contestId, page);
            return new LeaderboardPageDto(new ArrayList<>(), page, size, 0);
        }

        List<ContestLeaderboardEntryDto> leaderboard = new ArrayList<>();
        // Calculate starting rank based on page number
        int startingRank = page * size + 1;
        AtomicInteger rank = new AtomicInteger(startingRank);

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

        return new LeaderboardPageDto(leaderboard, page, size, (int) totalItems);
    }

    @Override
    public List<ContestLeaderboardEntryDto> getLeaderboard(String contestId) {
        log.info("Getting full leaderboard for contest {}", contestId);

        // Check if contest is finalized
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        if (contest.isFinalized()) {
            // Get from database for finalized contests
            return getLeaderboardFromDatabase(contestId);
        } else {
            // Get from Redis for active contests
            return getLeaderboardFromCache(contestId);
        }
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

        // Check if the contest exists
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Initialize leaderboard (clear existing data)
        initializeLeaderboard(contestId);

        // Get all contest submissions
        List<ContestSubmission> submissions = contestSubmissionRepository.findAllByContestId(contestId);

        // Prepare batch updates
        Map<String, Double> batchScores = new HashMap<>();
        Map<String, Map<String, Integer>> userProblemPoints = new HashMap<>();

        // Process each submission to build the batch updates
        for (ContestSubmission submission : submissions) {
            String userId = submission.getUserId();
            String problemId = submission.getProblemId();
            int points = submission.getPoints();

            // Track highest points per problem for each user
            userProblemPoints
                    .computeIfAbsent(userId, k -> new HashMap<>())
                    .compute(problemId, (k, v) -> v == null ? points : Math.max(v, points));

            // Also update problem status
            updateProblemStatus(
                    contestId,
                    userId,
                    problemId,
                    points,
                    submission.getSubmissionId()
            );
        }

        // Calculate total points for each user
        for (Map.Entry<String, Map<String, Integer>> userEntry : userProblemPoints.entrySet()) {
            String userId = userEntry.getKey();
            int totalPoints = userEntry.getValue().values().stream().mapToInt(Integer::intValue).sum();
            batchScores.put(userId, (double) totalPoints);
        }

        // Perform batch update
        cacheService.batchUpdateScores(contestId, batchScores);

        // Add attempt counts
        updateAttemptCounts(contestId);

        log.info("Leaderboard rebuilt for contest {}", contestId);

        // Check if contest is completed
        LocalDateTime now = LocalDateTime.now();
        if (contest.getEndTime().isBefore(now)) {
            // Cache the standings for this completed contest
            cacheCompletedContestStandings(contestId);
            // Mark as completed in Redis
            cacheService.markContestCompleted(contestId);
        }

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

    @Override
    public void markContestFinalized(String contestId) {
        cacheService.markContestCompleted(contestId);

        // Cache the final standings
        cacheCompletedContestStandings(contestId);

        log.info("Contest {} marked as finalized", contestId);
    }

    // Private helper methods

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
     * Cache the full standings for a completed contest
     */
    private void cacheCompletedContestStandings(String contestId) {
        try {
            // Generate full leaderboard
            Set<ZSetOperations.TypedTuple<Object>> allScores = cacheService.getContestLeaderboard(contestId);
            List<ContestLeaderboardEntryDto> entries = new ArrayList<>();
            AtomicInteger rank = new AtomicInteger(1);

            for (ZSetOperations.TypedTuple<Object> entry : allScores) {
                String userId = (String) entry.getValue();
                if (userId == null) continue;

                User user = userRepository.findById(userId).orElse(null);
                if (user == null) continue;

                Map<String, ProblemSubmissionStatusDto> problemStatuses = getUserProblemStatuses(contestId, userId);

                ContestLeaderboardEntryDto leaderboardEntry = ContestLeaderboardEntryDto.builder()
                        .userId(userId)
                        .username(user.getUsername())
                        .rank(rank.getAndIncrement())
                        .totalPoints(Objects.requireNonNull(entry.getScore()).intValue())
                        .problemStatuses(new ArrayList<>(problemStatuses.values()))
                        .build();

                entries.add(leaderboardEntry);
            }

            // Create page DTO with all entries
            LeaderboardPageDto fullStandings = new LeaderboardPageDto(
                    entries, 0, entries.size(), entries.size());

            // Serialize and cache
            String serialized = objectMapper.writeValueAsString(fullStandings);
            cacheService.storeContestStandings(contestId, serialized);

            log.info("Cached complete standings for contest {} with {} entries", contestId, entries.size());
        } catch (Exception e) {
            log.error("Error caching contest standings for {}: {}", contestId, e.getMessage(), e);
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
        try {
            ContestLeaderboardEntryDto userRanking = getUserRanking(contestId, userId);

            if (userRanking == null) {
                // Create default entry for uninitialized users
                User user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    log.warn("User not found for ID: {}", userId);
                    return;
                }

                userRanking = ContestLeaderboardEntryDto.builder()
                        .userId(userId)
                        .username(user.getUsername())
                        .rank(0)
                        .totalPoints(0)
                        .problemStatuses(new ArrayList<>())
                        .build();
            }

            messagingTemplate.convertAndSend(
                    "/topic/contest/" + contestId + "/user/" + userId,
                    userRanking
            );
        } catch (Exception e) {
            log.error("Error publishing user update for contest: {}, user: {}",
                    contestId, userId, e);
        }
    }

    private List<ContestLeaderboardEntryDto> getLeaderboardFromDatabase(String contestId) {
        log.info("Loading leaderboard from database for contest {}", contestId);

        List<ContestPoints> contestPoints = contestPointsRepository
                .findContestLeaderboardWithUsers(contestId);

        List<ContestLeaderboardEntryDto> leaderboard = new ArrayList<>();

        for (ContestPoints cp : contestPoints) {
            try {
                // Parse problem details from JSON
                List<ProblemSubmissionStatusDto> problemStatuses =
                        objectMapper.readValue(
                                cp.getProblemDetailsJson(),
                                new TypeReference<List<ProblemSubmissionStatusDto>>() {}
                        );

                ContestLeaderboardEntryDto entry = ContestLeaderboardEntryDto.builder()
                        .userId(cp.getUserId())
                        .username(cp.getUser().getUsername())
                        .rank(cp.getRank())
                        .totalPoints(cp.getPoints())
                        .problemStatuses(problemStatuses)
                        .build();

                leaderboard.add(entry);

            } catch (Exception e) {
                log.error("Error parsing problem details for user {} in contest {}",
                        cp.getUserId(), contestId, e);
            }
        }

        return leaderboard;
    }

    private List<ContestLeaderboardEntryDto> getLeaderboardFromCache(String contestId) {
        log.info("Loading leaderboard from Redis cache for contest {}", contestId);

        // Your existing implementation
        LeaderboardPageDto firstPage = getLeaderboardPage(contestId, 0, 100);
        return firstPage.getEntries();
    }

    private void updateDatabaseScore(String contestId, String userId,
                                     int totalPoints, String problemId) {
        try {
            ContestPoints contestPoints = contestPointsRepository
                    .findByContestIdAndUserId(contestId, userId)
                    .orElseGet(() -> ContestPoints.builder()
                            .contestId(contestId)
                            .userId(userId)
                            .points(0)
                            .rank(0)
                            .problemsSolved(0)
                            .totalAttempts(0)
                            .problemDetailsJson("[]")
                            .build());

            // Update basic fields
            contestPoints.setPoints(totalPoints);
            contestPoints.setLastSubmissionTime(LocalDateTime.now());

            // Note: Full details will be updated during finalization
            contestPointsRepository.save(contestPoints);

        } catch (Exception e) {
            log.error("Error updating database score for user {} in contest {}",
                    userId, contestId, e);
        }
    }
}