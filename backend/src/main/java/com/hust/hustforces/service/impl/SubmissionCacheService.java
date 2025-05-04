package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;
    private static final String SUBMISSION_CACHE_KEY = "submission:";
    private static final long CACHE_TTL_HOURS = 24;

    /**
     * Cache a submission result
     */
    public void cacheSubmissionResult(SubmissionDetailDto submission) {
        try {
            String key = SUBMISSION_CACHE_KEY + submission.getId();
            String value = objectMapper.writeValueAsString(submission);

            redisTemplate.opsForValue().set(key, value, CACHE_TTL_HOURS, TimeUnit.HOURS);
        } catch (Exception e) {
            log.warn("Failed to cache submission result: {}", submission.getId(), e);
        }
    }

    /**
     * Get a cached submission result
     */
    public Optional<SubmissionDetailDto> getCachedSubmissionResult(String submissionId) {
        try {
            String key = SUBMISSION_CACHE_KEY + submissionId;
            String value = (String) redisTemplate.opsForValue().get(key);

            if (value != null) {
                return Optional.of(objectMapper.readValue(value, SubmissionDetailDto.class));
            }
        } catch (Exception e) {
            log.warn("Failed to get cached submission result: {}", submissionId, e);
        }

        return Optional.empty();
    }

    /**
     * Invalidate a cached submission result
     */
    public void invalidateCache(String submissionId) {
        String key = SUBMISSION_CACHE_KEY + submissionId;
        redisTemplate.delete(key);
    }
}
