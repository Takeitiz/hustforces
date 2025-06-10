package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.exception.ResourceNotFoundException;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

        // Get or create stats record
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseGet(() -> {
                    UserStats newStats = new UserStats();
                    newStats.setUserId(user.getId());
                    newStats.setCurrentRank(1500); // Default rating
                    newStats.setMaxRank(1500);
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

        stats.setContests(user.getContestPoints() != null ? user.getContestPoints().size() : 0);

        // Update rating if user has contest points
        if (user.getContestPoints() != null && !user.getContestPoints().isEmpty()) {
            // Get the latest rating from contest points
            int latestRating = user.getContestPoints().stream()
                    .mapToInt(cp -> {
                        // If ContestPoints doesn't have rating, calculate from rank
                        // This is a placeholder - you should store actual rating in ContestPoints
                        return cp.getRank() > 0 ? 3000 - (cp.getRank() * 10) : stats.getCurrentRank();
                    })
                    .max()
                    .orElse(stats.getCurrentRank());

            stats.setCurrentRank(latestRating);
            stats.setMaxRank(Math.max(stats.getMaxRank(), latestRating));
        }

        // Update timestamp
        stats.setLastCalculated(LocalDateTime.now());

        // Save stats
        UserStats savedStats = userStatsRepository.save(stats);
        log.debug("Saved statistics for user: {}, problems solved: {}, acceptance rate: {}%",
                user.getId(),
                savedStats.getProblemsSolved(),
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