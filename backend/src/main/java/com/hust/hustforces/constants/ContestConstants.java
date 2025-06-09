package com.hust.hustforces.constants;

/**
 * Constants used across contest-related services
 */
public final class ContestConstants {

    private ContestConstants() {
        // Prevent instantiation
    }

    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;

    // Rating system
    public static final int DEFAULT_RATING = 1500;
    public static final int MAX_RATING_CHANGE = 150;

    // K-factors for Elo rating
    public static final int K_FACTOR_NEW_USER = 40;      // Under 10 contests
    public static final int K_FACTOR_PROVISIONAL = 30;   // Under 30 contests
    public static final int K_FACTOR_ESTABLISHED = 20;   // 30+ contests

    // Performance bonuses
    public static final double TOP_10_PERCENT_BONUS = 0.2;
    public static final double TOP_25_PERCENT_BONUS = 0.1;
    public static final double SCORE_MULTIPLIER_BONUS = 0.1;

    // Contest limits
    public static final int MAX_PROBLEMS_PER_CONTEST = 20;
    public static final int MIN_PROBLEMS_PER_CONTEST = 1;

    // Submission processing
    public static final int MAX_SUBMISSION_RETRIES = 3;
    public static final long STALLED_SUBMISSION_TIMEOUT_MINUTES = 5;

    // Leaderboard
    public static final long LEADERBOARD_UPDATE_INTERVAL_MS = 5000; // 5 seconds
    public static final int LEADERBOARD_CACHE_TTL_HOURS = 24;

    // Rate limiting
    public static final int MAX_SUBMISSIONS_PER_MINUTE = 10;
    public static final long RATE_LIMIT_WINDOW_SECONDS = 60;
}