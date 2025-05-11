package com.hust.hustforces.service.impl;

import com.hust.hustforces.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoteCacheService {
    private final VoteRepository voteRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String UPVOTE_KEY_PREFIX = "vote:up:";
    private static final String DOWNVOTE_KEY_PREFIX = "vote:down:";
    private static final long CACHE_EXPIRATION_SECONDS = 3600; // 1 hour

    public int getUpvoteCount(String entityId, String entityType) {
        String key = UPVOTE_KEY_PREFIX + entityType + ":" + entityId;

        // Try from cache first
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return (Integer) cached;
        }

        // If not in cache, get from database
        int count = voteRepository.countByEntityIdAndEntityTypeAndIsUpvote(entityId, entityType, true);

        // Cache the result
        redisTemplate.opsForValue().set(key, count, CACHE_EXPIRATION_SECONDS, TimeUnit.SECONDS);

        return count;
    }

    public int getDownvoteCount(String entityId, String entityType) {
        String key = DOWNVOTE_KEY_PREFIX + entityType + ":" + entityId;

        // Try from cache first
        Object cached = redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return (Integer) cached;
        }

        // If not in cache, get from database
        int count = voteRepository.countByEntityIdAndEntityTypeAndIsUpvote(entityId, entityType, false);

        // Cache the result
        redisTemplate.opsForValue().set(key, count, CACHE_EXPIRATION_SECONDS, TimeUnit.SECONDS);

        return count;
    }

    public void updateVoteCache(String entityId, String entityType, boolean isUpvote, int change) {
        String key = (isUpvote ? UPVOTE_KEY_PREFIX : DOWNVOTE_KEY_PREFIX) + entityType + ":" + entityId;

        // Update the cache if it exists
        redisTemplate.opsForValue().increment(key, change);
    }

    public void invalidateVoteCache(String entityId, String entityType) {
        redisTemplate.delete(UPVOTE_KEY_PREFIX + entityType + ":" + entityId);
        redisTemplate.delete(DOWNVOTE_KEY_PREFIX + entityType + ":" + entityId);
    }
}
