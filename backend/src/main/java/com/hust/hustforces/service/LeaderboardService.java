package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.LeaderboardPageDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;

import java.util.List;
import java.util.Map;

public interface LeaderboardService {

    /**
     * Updates a user's score in the leaderboard for a specific contest
     *
     * @param contestId The contest ID
     * @param userId The user ID
     * @param problemId The problem ID
     * @param points The points earned
     * @param submissionId The submission ID
     * @return The new rank of the user
     */
    int updateUserScore(String contestId, String userId, String problemId, int points, String submissionId);

    /**
     * Gets a paginated leaderboard
     *
     * @param contestId The contest ID
     * @param page The page number (0-based)
     * @param size The page size
     * @return Paginated leaderboard entries
     */
    LeaderboardPageDto getLeaderboardPage(String contestId, int page, int size);

    /**
     * Gets the current leaderboard for a contest (legacy method)
     *
     * @param contestId The contest ID
     * @return The sorted list of leaderboard entries
     */
    List<ContestLeaderboardEntryDto> getLeaderboard(String contestId);

    /**
     * Gets a user's position and score in the leaderboard
     *
     * @param contestId The contest ID
     * @param userId The user ID
     * @return The leaderboard entry for the user, or null if not found
     */
    ContestLeaderboardEntryDto getUserRanking(String contestId, String userId);

    /**
     * Gets problem-specific submission statistics for a user in a contest
     *
     * @param contestId The contest ID
     * @param userId The user ID
     * @return Map of problem IDs to submission status DTOs
     */
    Map<String, ProblemSubmissionStatusDto> getUserProblemStatuses(String contestId, String userId);

    /**
     * Initializes or resets the leaderboard for a contest
     *
     * @param contestId The contest ID
     */
    void initializeLeaderboard(String contestId);

    /**
     * Rebuilds the entire leaderboard from database data
     *
     * @param contestId The contest ID
     */
    void rebuildLeaderboard(String contestId);

    /**
     * Increments the attempt count for a user on a specific problem
     *
     * @param contestId The contest ID
     * @param userId The user ID
     * @param problemId The problem ID
     */
    void incrementAttemptCount(String contestId, String userId, String problemId);

    /**
     * Mark a contest as finalized to prevent further score updates
     *
     * @param contestId The contest ID
     */
    void markContestFinalized(String contestId);
}
