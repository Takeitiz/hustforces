package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.constants.ContestConstants;
import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.entity.ContestPoints;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserStatsCalculationService {
    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;
    private final UserProfileCacheService cacheService;

    // Run every 15 minutes to process users who need updating
    @Scheduled(fixedRate = 900000)
    public void calculateUserStatsIncremental() {
        log.info("Starting incremental user statistics calculation");

        try {
            // Find users needing updates (stats older than 1 hour or never calculated)
            LocalDateTime cutoffTime = LocalDateTime.now().minusHours(1);
            List<User> usersToUpdate = userRepository.findUsersNeedingStatsUpdate(cutoffTime);

            log.info("Found {} users needing stats update", usersToUpdate.size());

            for (User user : usersToUpdate) {
                try {
                    updateUserStatsInternal(user);
                } catch (Exception e) {
                    log.error("Error calculating stats for user {}: {}",
                            user.getId(), e.getMessage(), e);
                }
            }

            // Also process users who have never had stats calculated
            List<User> usersWithoutStats = userRepository.findUsersWithoutStats();
            log.info("Found {} users without any statistics", usersWithoutStats.size());

            for (User user : usersWithoutStats) {
                try {
                    // Fetch user with contest points
                    User userWithData = userRepository.findByIdWithContestPoints(user.getId())
                            .orElse(user);
                    updateUserStatsInternal(userWithData);
                } catch (Exception e) {
                    log.error("Error creating initial stats for user {}: {}",
                            user.getId(), e.getMessage(), e);
                }
            }

        } catch (Exception e) {
            log.error("Error in incremental stats calculation", e);
        }

        log.info("Completed incremental user statistics calculation");
    }

    // Run once per day at 3 AM to ensure all users get updated
    @Scheduled(cron = "0 0 3 * * ?")
    public void calculateAllUserStats() {
        log.info("Starting full user statistics calculation");

        try {
            List<User> allUsers = userRepository.findAllWithContestPoints();
            log.info("Processing statistics for {} users", allUsers.size());

            for (User user : allUsers) {
                try {
                    updateUserStatsInternal(user);

                    // Small delay to avoid overwhelming the system
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Stats calculation interrupted");
                    break;
                } catch (Exception e) {
                    log.error("Error calculating stats for user {}: {}",
                            user.getId(), e.getMessage(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error in full stats calculation", e);
        }

        log.info("Completed full user statistics calculation");
    }

    // Can be called directly when needed (e.g., after a submission)
    @Transactional
    public void updateUserStats(String userId) {
        log.debug("Calculating statistics for user: {}", userId);

        try {
            User user = userRepository.findByIdWithContestPoints(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            updateUserStatsInternal(user);
        } catch (Exception e) {
            log.error("Error updating stats for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to update user statistics", e);
        }
    }

    private void updateUserStatsInternal(User user) {
        log.debug("Updating statistics for user: {}", user.getId());

        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserStats newStats = new UserStats();
                    newStats.setUserId(user.getId());
                    newStats.setCurrentRank(ContestConstants.DEFAULT_RATING);
                    newStats.setMaxRank(ContestConstants.DEFAULT_RATING);
                    return newStats;
                });

        // Calculate basic submission stats using efficient queries
        stats.setTotalSubmissions(submissionRepository.countByUserId(user.getId()));
        stats.setAcceptedSubmissions(submissionRepository.countByUserIdAndStatusAC(user.getId()));
        stats.setProblemsSolved(submissionRepository.countDistinctProblemsByUserIdAndStatusAC(user.getId()));

        // Calculate problems by difficulty
        Map<Difficulty, Integer> problemsByDifficulty = new HashMap<>();
        problemsByDifficulty.put(Difficulty.EASY, 0);
        problemsByDifficulty.put(Difficulty.MEDIUM, 0);
        problemsByDifficulty.put(Difficulty.HARD, 0);

        List<Object[]> difficultyStats = submissionRepository.countProblemsByDifficultyForUser(user.getId());
        for (Object[] row : difficultyStats) {
            Difficulty difficulty = (Difficulty) row[0];
            Long count = (Long) row[1];
            problemsByDifficulty.put(difficulty, count.intValue());
        }

        // Calculate submission calendar (submissions by date)
        Map<String, Integer> submissionCalendar = new HashMap<>();
        List<Object[]> calendarData = submissionRepository.countSubmissionsByDateForUser(user.getId());
        for (Object[] row : calendarData) {
            String date = (String) row[0];
            Long count = (Long) row[1];
            submissionCalendar.put(date, count.intValue());
        }

        // Serialize maps to JSON
        try {
            stats.setProblemsByDifficultyJson(objectMapper.writeValueAsString(problemsByDifficulty));
            stats.setSubmissionCalendarJson(objectMapper.writeValueAsString(submissionCalendar));
        } catch (JsonProcessingException e) {
            log.error("Error serializing statistics data for user {}", user.getId(), e);
            // Set empty JSON objects on error
            stats.setProblemsByDifficultyJson("{}");
            stats.setSubmissionCalendarJson("{}");
        }

        // Set contest count
        stats.setContests(user.getContestPoints() != null ? user.getContestPoints().size() : 0);

        if (user.getContestPoints() != null && !user.getContestPoints().isEmpty()) {
            // Find the most recent contest participation with rating data
            Optional<ContestPoints> latestRatedContest = user.getContestPoints().stream()
                    .filter(cp -> cp.getRatingAfter() != null) // Only consider contests with rating data
                    .max(Comparator.comparing(ContestPoints::getCreatedAt));

            if (latestRatedContest.isPresent()) {
                ContestPoints latest = latestRatedContest.get();

                // Update current rating from the latest contest
                stats.setCurrentRank(latest.getRatingAfter());

                // Update max rating if this is higher
                stats.setMaxRank(Math.max(stats.getMaxRank(), latest.getRatingAfter()));

                // Update rating change
                if (latest.getRatingChange() != null) {
                    stats.setRatingChange(latest.getRatingChange());
                } else if (latest.getRatingBefore() != null) {
                    // Calculate rating change if not stored
                    stats.setRatingChange(latest.getRatingAfter() - latest.getRatingBefore());
                }

                log.debug("Updated user {} rating from contest: current={}, max={}, change={}",
                        user.getId(), stats.getCurrentRank(), stats.getMaxRank(), stats.getRatingChange());
            } else {
                log.debug("User {} has participated in contests but no rating data available yet", user.getId());
                // Keep the default rating or existing rating
            }
        } else {
            log.debug("User {} has not participated in any contests, keeping default rating", user.getId());
            // Ensure rating change is 0 for users who haven't competed
            stats.setRatingChange(0);
        }

        // Update timestamp
        stats.setLastCalculated(LocalDateTime.now());

        // Save stats
        UserStats savedStats = userStatsRepository.save(stats);
        log.debug("Saved statistics for user: {}, problems solved: {}, rating: {}, acceptance rate: {}%",
                user.getId(),
                savedStats.getProblemsSolved(),
                savedStats.getCurrentRank(),
                savedStats.getTotalSubmissions() > 0 ?
                        (savedStats.getAcceptedSubmissions() * 100.0 / savedStats.getTotalSubmissions()) : 0);

        // Invalidate cache to ensure fresh data is loaded next time
        try {
            cacheService.invalidateCache(user.getUsername());
            log.debug("Invalidated cache for user: {}", user.getUsername());
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for user: {}", user.getUsername(), e);
        }
    }
}