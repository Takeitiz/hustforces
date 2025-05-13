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

        // First, find users without any stats at all
        List<UserStats> missingStats = userStatsRepository.findByLastCalculatedIsNull();
        if (!missingStats.isEmpty()) {
            log.info("Found {} users with no statistics", missingStats.size());
            missingStats.forEach(stats -> {
                try {
                    updateUserStats(stats.getUserId());
                } catch (Exception e) {
                    log.error("Error calculating stats for user {}: {}", stats.getUserId(), e.getMessage());
                }
            });
        }

        // Then find users with oldest stat updates
        List<UserStats> oldestStats = userStatsRepository.findTop50ByOrderByLastCalculatedAsc();
        if (!oldestStats.isEmpty()) {
            log.info("Updating statistics for {} users with oldest data", oldestStats.size());
            oldestStats.forEach(stats -> {
                try {
                    updateUserStats(stats.getUserId());
                } catch (Exception e) {
                    log.error("Error updating stats for user {}: {}", stats.getUserId(), e.getMessage());
                }
            });
        }

        log.info("Completed incremental user statistics calculation");
    }

    // Run once per day to ensure all users get updated
    @Scheduled(cron = "0 0 3 * * ?") // 3 AM every day
    public void calculateAllUserStats() {
        log.info("Starting full user statistics calculation");

        userRepository.findAll().forEach(user -> {
            try {
                updateUserStats(user.getId());
            } catch (Exception e) {
                log.error("Error calculating stats for user {}: {}", user.getId(), e.getMessage());
            }
        });

        log.info("Completed full user statistics calculation");
    }

    // Can also be called directly when needed (e.g., after a submission)
    @Transactional
    public void updateUserStats(String userId) {
        log.debug("Calculating statistics for user: {}", userId);

        // Get user to verify they exist and to get username for cache invalidation
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Get or create stats record
        UserStats stats = userStatsRepository.findById(userId)
                .orElse(new UserStats());
        stats.setUserId(userId);

        // Calculate basic submission stats with efficient queries
        stats.setTotalSubmissions(submissionRepository.countByUserId(userId));
        stats.setAcceptedSubmissions(submissionRepository.countByUserIdAndStatusAC(userId));
        stats.setProblemsSolved(submissionRepository.countDistinctProblemsByUserIdAndStatusAC(userId));

        // Calculate problems by difficulty
        Map<Difficulty, Integer> problemsByDifficulty = new HashMap<>();
        submissionRepository.countProblemsByDifficultyForUser(userId).forEach(row -> {
            Difficulty difficulty = (Difficulty) row[0];
            Long count = (Long) row[1];
            problemsByDifficulty.put(difficulty, count.intValue());
        });

        // Calculate submission calendar
        Map<String, Integer> submissionCalendar = new HashMap<>();
        submissionRepository.countSubmissionsByDateForUser(userId).forEach(row -> {
            String date = (String) row[0];
            Long count = (Long) row[1];
            submissionCalendar.put(date, count.intValue());
        });

        // Serialize to JSON
        try {
            stats.setProblemsByDifficultyJson(objectMapper.writeValueAsString(problemsByDifficulty));
            stats.setSubmissionCalendarJson(objectMapper.writeValueAsString(submissionCalendar));
        } catch (JsonProcessingException e) {
            log.error("Error serializing statistics data for user {}", userId, e);
        }

        // Calculate contest stats (already have this from relations)
        stats.setContests(user.getContestPoints().size());

        // TODO: Implement real rating calculation based on Elo or similar algorithm
        // For now, using placeholder values or previous values if they exist
        if (stats.getCurrentRank() == 0) {
            stats.setCurrentRank(1500);
            stats.setMaxRank(1500);
        }

        // Update timestamp
        stats.setLastCalculated(LocalDateTime.now());

        // Save stats
        userStatsRepository.save(stats);

        // Invalidate cache
        cacheService.invalidateCache(user.getUsername());

        log.debug("Completed statistics calculation for user: {}", userId);
    }
}