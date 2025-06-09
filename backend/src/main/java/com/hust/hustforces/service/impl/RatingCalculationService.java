package com.hust.hustforces.service.impl;

import com.hust.hustforces.constants.ContestConstants;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.entity.Contest;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RatingCalculationService {
    private final UserStatsRepository userStatsRepository;

    public record RatingChange(int oldRating, int newRating, int change) {}

    /**
     * Calculate rating changes for all participants in a contest.
     *
     * @param contest The contest entity
     * @param leaderboard The sorted leaderboard entries
     * @return Map of user IDs to rating changes
     */
    public Map<String, RatingChange> calculateRatingChanges(Contest contest, List<ContestLeaderboardEntryDto> leaderboard) {
        log.info("Calculating rating changes for contest {}, with {} participants",
                contest.getId(), leaderboard.size());

        if (leaderboard == null || leaderboard.isEmpty()) {
            log.warn("Leaderboard is empty for contest {}. No ratings will be calculated.", contest.getId());
            return Collections.emptyMap();
        }

        // Step 1: Efficiently load user stats (ratings and contest counts) for all participants
        Set<String> userIds = leaderboard.stream()
                .map(ContestLeaderboardEntryDto::getUserId)
                .collect(Collectors.toSet());

        Map<String, UserStats> userStatsMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<UserStats> fetchedStats = userStatsRepository.findAllById(userIds);
            userStatsMap = fetchedStats.stream()
                    .collect(Collectors.toMap(UserStats::getUserId, Function.identity()));
        }

        Map<String, Integer> currentRatings = new HashMap<>();
        Map<String, Integer> contestCounts = new HashMap<>();

        for (ContestLeaderboardEntryDto entry : leaderboard) {
            String userId = entry.getUserId();
            UserStats stats = userStatsMap.get(userId);
            if (stats != null) {
                currentRatings.put(userId, stats.getCurrentRank());
                contestCounts.put(userId, stats.getContests());
            } else {
                currentRatings.put(userId, ContestConstants.DEFAULT_RATING);
                contestCounts.put(userId, 0); // New user, 0 contests
            }
        }

        // Handle case with only one participant
        if (leaderboard.size() < 2) {
            log.info("Contest {} has less than 2 participants. No rating changes calculated.", contest.getId());
            return Collections.emptyMap();
        }

        // Step 2: Calculate expected performance for each participant
        Map<String, Double> expectedPerformances = calculateExpectedPerformances(leaderboard, currentRatings);

        // Step 3: Calculate actual performance scores based on ranking
        Map<String, Double> actualPerformances = calculateActualPerformances(leaderboard);

        // Step 4: Calculate rating changes
        Map<String, RatingChange> ratingChanges = new HashMap<>();

        for (ContestLeaderboardEntryDto entry : leaderboard) {
            String userId = entry.getUserId();

            int oldRating = currentRatings.get(userId);
            double expected = expectedPerformances.get(userId);
            double actual = actualPerformances.get(userId);

            // Determine K-factor based on user experience
            int kFactor = determineKFactor(contestCounts.get(userId));

            // Calculate rating change using Elo formula
            int ratingChange = calculateEloRatingChange(kFactor, actual, expected);

            // Apply competition-specific adjustments
            ratingChange = adjustRatingChange(ratingChange, entry.getRank(), leaderboard.size(),
                    entry.getTotalPoints(), oldRating);

            // Cap the rating change
            ratingChange = Math.max(-ContestConstants.MAX_RATING_CHANGE,
                    Math.min(ContestConstants.MAX_RATING_CHANGE, ratingChange));

            // Calculate new rating
            int newRating = oldRating + ratingChange;

            // Store result
            ratingChanges.put(userId, new RatingChange(oldRating, newRating, ratingChange));

            log.debug("User {} (rank {}): Rating change {} ({} → {})",
                    userId, entry.getRank(), ratingChange, oldRating, newRating);
        }

        return ratingChanges;
    }

    /**
     * Calculate expected performances for all participants
     */
    private Map<String, Double> calculateExpectedPerformances(
            List<ContestLeaderboardEntryDto> leaderboard, Map<String, Integer> ratings) {
        Map<String, Double> expected = new HashMap<>();
        int numOpponents = leaderboard.size() - 1;

        if (numOpponents <= 0) {
            for (ContestLeaderboardEntryDto player1 : leaderboard) {
                expected.put(player1.getUserId(), 0.5);
            }
            return expected;
        }

        for (ContestLeaderboardEntryDto player1 : leaderboard) {
            String player1Id = player1.getUserId();
            double expectedScoreSum = 0.0;

            for (ContestLeaderboardEntryDto player2 : leaderboard) {
                if (!player1Id.equals(player2.getUserId())) {
                    expectedScoreSum += calculateWinProbability(
                            ratings.get(player1Id), ratings.get(player2.getUserId()));
                }
            }
            expected.put(player1Id, expectedScoreSum / numOpponents);
        }
        return expected;
    }

    /**
     * Calculate actual performances for all participants
     */
    private Map<String, Double> calculateActualPerformances(List<ContestLeaderboardEntryDto> leaderboard) {
        Map<String, Double> actual = new HashMap<>();
        int totalParticipants = leaderboard.size();

        if (totalParticipants == 0) {
            return actual;
        }

        List<ContestLeaderboardEntryDto> sortedLeaderboard = new ArrayList<>(leaderboard);
        sortedLeaderboard.sort(Comparator.comparingInt(ContestLeaderboardEntryDto::getRank));

        for (ContestLeaderboardEntryDto entry : sortedLeaderboard) {
            double rankScore;
            if (totalParticipants == 1) {
                rankScore = 1.0;
            } else {
                rankScore = 1.0 - ((double) entry.getRank() - 1) / totalParticipants;
            }
            actual.put(entry.getUserId(), rankScore);
        }
        return actual;
    }

    /**
     * Calculate the probability of player1 winning against player2
     * using the Elo formula
     */
    private double calculateWinProbability(int rating1, int rating2) {
        return 1.0 / (1.0 + Math.pow(10, (double)(rating2 - rating1) / 400.0));
    }

    /**
     * Calculate the Elo rating change
     */
    private int calculateEloRatingChange(int kFactor, double actual, double expected) {
        return (int) Math.round(kFactor * (actual - expected));
    }

    /**
     * Determine the K-factor based on user experience
     */
    private int determineKFactor(int contestCount) {
        if (contestCount < 10) {
            return ContestConstants.K_FACTOR_NEW_USER;
        } else if (contestCount < 30) {
            return ContestConstants.K_FACTOR_PROVISIONAL;
        } else {
            return ContestConstants.K_FACTOR_ESTABLISHED;
        }
    }

    /**
     * Adjust rating change based on contest-specific factors
     */
    private int adjustRatingChange(int baseChange, int rank, int totalParticipants,
                                   int score, int currentRating) {
        if (totalParticipants == 0) return baseChange;

        // Adjust for contest size
        double contestSizeFactor = Math.max(0.5, Math.min(2.0, Math.sqrt(totalParticipants) / 5.0));

        // Adjust for current rating
        double ratingBracketFactor = Math.max(0.8, 2000.0 / Math.max(1000, currentRating));

        // Performance bonus for top performers
        double performanceBonusFactor = 0.0;
        if (rank <= Math.max(1, totalParticipants * 0.1)) {  // Top 10%
            performanceBonusFactor = ContestConstants.TOP_10_PERCENT_BONUS;
        } else if (rank <= Math.max(1, totalParticipants * 0.25)) {  // Top 25%
            performanceBonusFactor = ContestConstants.TOP_25_PERCENT_BONUS;
        }

        // Score factor
        double scoreMultiplier = 1.0 + (score > 0 ? ContestConstants.SCORE_MULTIPLIER_BONUS : 0.0);

        // Apply the adjustments
        double adjustedChange = baseChange * contestSizeFactor * ratingBracketFactor *
                (1.0 + performanceBonusFactor) * scoreMultiplier;

        return (int) Math.round(adjustedChange);
    }
}