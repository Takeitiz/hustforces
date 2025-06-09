package com.hust.hustforces.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Redis-based rate limiter for submission requests
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisRateLimiter {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:submission:";
    private static final int MAX_SUBMISSIONS_PER_MINUTE = 10;
    private static final long WINDOW_SIZE_SECONDS = 60;

    /**
     * Check if a user is allowed to make a submission
     * @param userId the user ID
     * @return true if the request is allowed, false if rate limit exceeded
     */
    public boolean allowRequest(String userId) {
        String key = RATE_LIMIT_KEY_PREFIX + userId;

        try {
            Long count = redisTemplate.opsForValue().increment(key);

            if (count == null) {
                log.error("Failed to increment rate limit counter for user: {}", userId);
                return true; // Allow request on Redis failure
            }

            if (count == 1) {
                // First request in the window, set expiration
                redisTemplate.expire(key, WINDOW_SIZE_SECONDS, TimeUnit.SECONDS);
            }

            boolean allowed = count <= MAX_SUBMISSIONS_PER_MINUTE;

            if (!allowed) {
                log.warn("Rate limit exceeded for user: {}. Count: {}", userId, count);
            }

            return allowed;

        } catch (Exception e) {
            log.error("Error checking rate limit for user: {}", userId, e);
            // On error, allow the request to avoid blocking users
            return true;
        }
    }

    /**
     * Get the current request count for a user
     * @param userId the user ID
     * @return current request count
     */
    public int getCurrentCount(String userId) {
        String key = RATE_LIMIT_KEY_PREFIX + userId;

        try {
            String value = (String) redisTemplate.opsForValue().get(key);
            return value != null ? Integer.parseInt(value) : 0;
        } catch (Exception e) {
            log.error("Error getting current count for user: {}", userId, e);
            return 0;
        }
    }

    /**
     * Reset rate limit for a user (useful for testing or admin operations)
     * @param userId the user ID
     */
    public void resetLimit(String userId) {
        String key = RATE_LIMIT_KEY_PREFIX + userId;
        redisTemplate.delete(key);
        log.info("Rate limit reset for user: {}", userId);
    }
}
