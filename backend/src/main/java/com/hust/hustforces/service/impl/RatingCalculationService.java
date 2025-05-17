package com.hust.hustforces.service.impl;

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

    // Elo K-factor - determines how dramatically ratings change
    // Lower for established users, higher for new users
    private static final int K_FACTOR_NEW_USER = 40;     // Under 10 contests
    private static final int K_FACTOR_PROVISIONAL = 30;  // Under 30 contests
    private static final int K_FACTOR_ESTABLISHED = 20;  // 30+ contests

    // Default starting rating for new users
    private static final int DEFAULT_RATING = 1500;

    // Rating change caps to prevent wild swings
    private static final int MAX_RATING_CHANGE = 150;

    public record RatingChange(int oldRating, int newRating, int change) {}

    /**
     * Calculate rating changes for all participants in a contest.
     * This version optimizes data loading by fetching UserStats once.
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
                currentRatings.put(userId, DEFAULT_RATING);
                contestCounts.put(userId, 0); // New user, 0 contests
            }
        }

        // Handle case with only one participant - no rating change possible in Elo vs others
        if (leaderboard.size() < 2) {
            log.info("Contest {} has less than 2 participants. No rating changes calculated.", contest.getId());
            // Optionally, you could return a map with 0 change for the single participant
            // For now, returning empty as no relative performance can be assessed.
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

            int oldRating = currentRatings.get(userId); // Should always exist due to population above
            double expected = expectedPerformances.get(userId);
            double actual = actualPerformances.get(userId);

            // Determine K-factor based on user experience
            int kFactor = determineKFactor(contestCounts.get(userId)); // Should always exist

            // Calculate rating change using Elo formula
            int ratingChange = calculateEloRatingChange(kFactor, actual, expected);

            // Apply competition-specific adjustments
            ratingChange = adjustRatingChange(ratingChange, entry.getRank(), leaderboard.size(),
                    entry.getTotalPoints(), oldRating);

            // Cap the rating change
            ratingChange = Math.max(-MAX_RATING_CHANGE, Math.min(MAX_RATING_CHANGE, ratingChange));

            // Calculate new rating
            int newRating = oldRating + ratingChange;

            // Store result
            ratingChanges.put(userId, new RatingChange(oldRating, newRating, ratingChange));

            log.debug("User {} (rank {}): Rating change {} ({} → {})",
                    userId, entry.getRank(), ratingChange, oldRating, newRating);
        }

        return ratingChanges;
    }

    // loadCurrentRatings and loadContestCounts methods are removed as their logic
    // is now integrated into calculateRatingChanges for efficiency.

    /**
     * Calculate expected performances for all participants
     */
    private Map<String, Double> calculateExpectedPerformances(
            List<ContestLeaderboardEntryDto> leaderboard, Map<String, Integer> ratings) {
        Map<String, Double> expected = new HashMap<>();
        int numOpponents = leaderboard.size() - 1;

        // If there are no opponents (e.g., single player), expected performance is undefined or could be set to a default.
        // The main method already checks for leaderboard.size() < 2.
        // This check is an additional safeguard if this method were called directly with such a leaderboard.
        if (numOpponents <= 0) {
            for (ContestLeaderboardEntryDto player1 : leaderboard) {
                expected.put(player1.getUserId(), 0.5); // Or some other default, e.g. 0.0 if no comparison
            }
            return expected;
        }

        for (ContestLeaderboardEntryDto player1 : leaderboard) {
            String player1Id = player1.getUserId();
            double expectedScoreSum = 0.0;

            for (ContestLeaderboardEntryDto player2 : leaderboard) {
                if (!player1Id.equals(player2.getUserId())) {
                    // Probability that player1 would beat player2
                    expectedScoreSum += calculateWinProbability(
                            ratings.get(player1Id), ratings.get(player2.getUserId()));
                }
            }
            // Normalize by the number of opponents
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
            return actual; // Empty map for empty leaderboard
        }

        // Sorting by rank is important if the input leaderboard isn't guaranteed to be sorted.
        // The problem description implies 'leaderboard' is sorted, but defensive sorting is safer.
        List<ContestLeaderboardEntryDto> sortedLeaderboard = new ArrayList<>(leaderboard);
        sortedLeaderboard.sort(Comparator.comparingInt(ContestLeaderboardEntryDto::getRank));

        for (ContestLeaderboardEntryDto entry : sortedLeaderboard) {
            // Calculate score based on rank (higher rank = lower score, but actual score is higher for better rank)
            // This converts rank to a 0-1 scale where 1 is the best (rank 1)
            // If totalParticipants is 1, rank is 1, score is 1.0 - (0 / 1) = 1.0.
            // If totalParticipants > 1, rank N gets 1.0 - ((N-1)/N).
            // The last person (rank = totalParticipants) gets 1.0 - ((totalParticipants-1)/totalParticipants) = 1/totalParticipants.
            double rankScore;
            if (totalParticipants == 1) { // Special case for a single participant
                rankScore = 1.0; // Max score
            } else {
                // Original formula: 1.0 - ((double) entry.getRank() - 1) / totalParticipants;
                // This can be problematic if ranks are not dense from 1 to N.
                // A more robust approach for actual score based on rank in Elo is often S_actual = (N - rank_i) / (N - 1) for rank_i from 0 to N-1
                // Or, if using ranks from 1 to N: S_actual = (N - rank_i + 1) / N (this is not standard Elo but a possible interpretation)
                // The provided formula: 1.0 - ((double) entry.getRank() - 1) / totalParticipants
                // For rank 1: 1.0 - 0 = 1.0
                // For rank N: 1.0 - (N-1)/N = 1/N
                // This seems reasonable for a rank-based actual score.
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
            return K_FACTOR_NEW_USER;
        } else if (contestCount < 30) {
            return K_FACTOR_PROVISIONAL;
        } else {
            return K_FACTOR_ESTABLISHED;
        }
    }

    /**
     * Adjust rating change based on contest-specific factors
     */
    private int adjustRatingChange(int baseChange, int rank, int totalParticipants,
                                   int score, int currentRating) {
        // Ensure totalParticipants is not zero to prevent division by zero if this method is called unexpectedly.
        if (totalParticipants == 0) return baseChange;


        // Adjust for contest size: larger contests should have more impact
        // Original: Math.sqrt(totalParticipants) / 5.0;
        // Consider a slightly less aggressive scaling or capping, e.g. for very large contests.
        // For N=1, factor = 0.2. For N=25, factor = 1. For N=100, factor = 2.
        double contestSizeFactor = Math.max(0.5, Math.min(2.0, Math.sqrt(totalParticipants) / 5.0)); // Capped between 0.5 and 2.0

        // Adjust for current rating: lower ratings should change more dramatically
        // Original: Math.max(0.8, 2000.0 / Math.max(1000, currentRating));
        // For rating 1000 -> 2.0. For 1500 -> 1.33. For 2000 -> 1.0. For 2500 -> 0.8.
        double ratingBracketFactor = Math.max(0.8, 2000.0 / Math.max(1000, currentRating));

        // Performance bonus for top performers
        double performanceBonusFactor = 0.0; // This is an additive factor to 1.0 later
        if (rank <= Math.max(1, totalParticipants * 0.1)) {  // Top 10% (at least 1st place)
            performanceBonusFactor = 0.2;
        } else if (rank <= Math.max(1, totalParticipants * 0.25)) {  // Top 25%
            performanceBonusFactor = 0.1;
        }

        // Score factor: higher scores should be rewarded.
        // Original: 1.0 + (score > 0 ? 0.1 : 0);
        // This gives a flat 10% bonus if any points are scored.
        // Consider a more granular approach if max score is known, e.g., (1 + 0.1 * (score / max_possible_score))
        // For now, keeping it simple as per original.
        double scoreMultiplier = 1.0 + (score > 0 ? 0.1 : 0.0);

        // Apply the adjustments
        // Note: Original was baseChange * factor1 * factor2 * (1.0 + bonus) * factor3
        // Ensuring factors are applied multiplicatively.
        double adjustedChange = baseChange * contestSizeFactor * ratingBracketFactor *
                (1.0 + performanceBonusFactor) * scoreMultiplier;

        return (int) Math.round(adjustedChange);
    }
}