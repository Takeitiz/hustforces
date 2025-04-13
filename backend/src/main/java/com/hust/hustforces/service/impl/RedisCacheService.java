package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Service to abstract Redis operations for caching and leaderboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Key prefixes
    private static final String CONTEST_SCORES_PREFIX = "contest:scores:";
    private static final String USER_PROBLEMS_PREFIX = "user:problems:";
    private static final String PROBLEM_ATTEMPTS_PREFIX = "problem:attempts:";

    /**
     * Get a user's score in a contest
     * @param contestId the contest ID
     * @param userId the user ID
     * @return the score or null if not found
     */
    public Double getUserScore(String contestId, String userId) {
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        return redisTemplate.opsForZSet().score(scoresKey, userId);
    }

    /**
     * Update a user's score in a contest
     * @param contestId the contest ID
     * @param userId the user ID
     * @param score the new score
     */
    public void updateUserScore(String contestId, String userId, double score) {
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        redisTemplate.opsForZSet().add(scoresKey, userId, score);
    }

    /**
     * Get a user's rank in a contest (1-based, higher score = better rank)
     * @param contestId the contest ID
     * @param userId the user ID
     * @return the rank or 0 if not found
     */
    public int getUserRank(String contestId, String userId) {
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        Double score = redisTemplate.opsForZSet().score(scoresKey, userId);
        if (score == null) return 0;

        Long higherScores = redisTemplate.opsForZSet().reverseRank(scoresKey, userId);
        return higherScores != null ? higherScores.intValue() + 1 : 0;
    }

    /**
     * Get all users and scores in a contest, ordered by rank
     * @param contestId the contest ID
     * @return set of user-score pairs
     */
    public Set<ZSetOperations.TypedTuple<Object>> getContestLeaderboard(String contestId) {
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        return redisTemplate.opsForZSet().reverseRangeWithScores(scoresKey, 0, -1);
    }

    /**
     * Store an object in the hash
     * @param key the hash key
     * @param hashKey the field name
     * @param value the object to store
     * @param <T> the object type
     * @return true if successful
     */
    public <T> boolean storeInHash(String key, String hashKey, T value) {
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForHash().put(key, hashKey, json);
            return true;
        } catch (JsonProcessingException e) {
            log.error("Error serializing object to JSON for key {}, hashKey {}", key, hashKey, e);
            return false;
        }
    }

    /**
     * Get an object from the hash
     * @param key the hash key
     * @param hashKey the field name
     * @param valueType the class of the object
     * @param <T> the object type
     * @return the object or null if not found
     */
    public <T> T getFromHash(String key, String hashKey, Class<T> valueType) {
        String json = (String) redisTemplate.opsForHash().get(key, hashKey);
        if (json == null) return null;

        try {
            return objectMapper.readValue(json, valueType);
        } catch (JsonProcessingException e) {
            log.error("Error deserializing JSON from hash for key {}, hashKey {}", key, hashKey, e);
            return null;
        }
    }

    /**
     * Get all entries from a hash
     * @param key the hash key
     * @param valueType the class of the object
     * @param <T> the object type
     * @return map of hash keys to objects
     */
    public <T> Map<String, T> getAllFromHash(String key, Class<T> valueType) {
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        Map<String, T> result = new HashMap<>();

        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            String hashKey = (String) entry.getKey();
            String json = (String) entry.getValue();

            try {
                T value = objectMapper.readValue(json, valueType);
                result.put(hashKey, value);
            } catch (JsonProcessingException e) {
                log.error("Error deserializing JSON from hash for key {}, hashKey {}", key, hashKey, e);
            }
        }

        return result;
    }

    /**
     * Clear all data for a contest
     * @param contestId the contest ID
     */
    public void clearContestData(String contestId) {
        String scoresKey = CONTEST_SCORES_PREFIX + contestId;
        redisTemplate.delete(scoresKey);

        // Delete user problem data
        Set<String> userProblemKeys = redisTemplate.keys(USER_PROBLEMS_PREFIX + contestId + ":*");
        if (userProblemKeys != null && !userProblemKeys.isEmpty()) {
            redisTemplate.delete(userProblemKeys);
        }

        // Delete problem attempt data
        Set<String> attemptKeys = redisTemplate.keys(PROBLEM_ATTEMPTS_PREFIX + contestId + ":*");
        if (attemptKeys != null && !attemptKeys.isEmpty()) {
            redisTemplate.delete(attemptKeys);
        }
    }

    /**
     * Get user problem key
     * @param contestId the contest ID
     * @param userId the user ID
     * @return the key
     */
    public String getUserProblemsKey(String contestId, String userId) {
        return USER_PROBLEMS_PREFIX + contestId + ":" + userId;
    }

    /**
     * Get problem attempts key
     * @param contestId the contest ID
     * @param userId the user ID
     * @return the key
     */
    public String getProblemAttemptsKey(String contestId, String userId) {
        return PROBLEM_ATTEMPTS_PREFIX + contestId + ":" + userId;
    }

    /**
     * Increment an attempt count
     * @param key the hash key
     * @param hashKey the field name
     * @return the new count
     */
    public int incrementHashCounter(String key, String hashKey) {
        String currentValue = (String) redisTemplate.opsForHash().get(key, hashKey);
        int currentCount = currentValue != null ? Integer.parseInt(currentValue) : 0;
        int newCount = currentCount + 1;

        redisTemplate.opsForHash().put(key, hashKey, String.valueOf(newCount));
        return newCount;
    }
}
