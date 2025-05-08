package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.ProblemDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Service to cache problem data in Redis to improve performance
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    // Cache key prefixes
    private static final String PROBLEM_DETAILS_PREFIX = "problem:details:";
    private static final String PROBLEM_CODE_PREFIX = "problem:code:";
    private static final String PROBLEM_INPUTS_PREFIX = "problem:inputs:";
    private static final String PROBLEM_OUTPUTS_PREFIX = "problem:outputs:";

    // Default cache TTL in hours
    private static final long DEFAULT_CACHE_TTL_HOURS = 24;

    /**
     * Cache problem details
     */
    public void cacheProblemDetails(String problemId, LanguageId languageId, ProblemDetails details) {
        try {
            String key = buildProblemDetailsKey(problemId, languageId);
            String value = objectMapper.writeValueAsString(details);
            redisTemplate.opsForValue().set(key, value, DEFAULT_CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.debug("Cached problem details for problem: {}, language: {}", problemId, languageId);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache problem details for problem: {}, language: {}",
                    problemId, languageId, e);
        }
    }

    /**
     * Get cached problem details
     */
    public Optional<ProblemDetails> getCachedProblemDetails(String problemId, LanguageId languageId) {
        try {
            String key = buildProblemDetailsKey(problemId, languageId);
            String value = (String) redisTemplate.opsForValue().get(key);

            if (value != null) {
                return Optional.of(objectMapper.readValue(value, ProblemDetails.class));
            }
        } catch (Exception e) {
            log.error("Failed to get cached problem details for problem: {}, language: {}",
                    problemId, languageId, e);
        }
        return Optional.empty();
    }

    /**
     * Cache problem boilerplate code
     */
    public void cacheProblemCode(String problemId, LanguageId languageId, String code) {
        String key = buildProblemCodeKey(problemId, languageId);
        redisTemplate.opsForValue().set(key, code, DEFAULT_CACHE_TTL_HOURS, TimeUnit.HOURS);
        log.debug("Cached boilerplate code for problem: {}, language: {}", problemId, languageId);
    }

    /**
     * Get cached problem boilerplate code
     */
    public Optional<String> getCachedProblemCode(String problemId, LanguageId languageId) {
        String key = buildProblemCodeKey(problemId, languageId);
        String code = (String) redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(code);
    }

    /**
     * Cache problem inputs
     */
    public void cacheProblemInputs(String problemId, List<String> inputs) {
        try {
            String key = buildProblemInputsKey(problemId);
            String value = objectMapper.writeValueAsString(inputs);
            redisTemplate.opsForValue().set(key, value, DEFAULT_CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.debug("Cached {} inputs for problem: {}", inputs.size(), problemId);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache inputs for problem: {}", problemId, e);
        }
    }

    /**
     * Get cached problem inputs
     */
    @SuppressWarnings("unchecked")
    public Optional<List<String>> getCachedProblemInputs(String problemId) {
        try {
            String key = buildProblemInputsKey(problemId);
            String value = (String) redisTemplate.opsForValue().get(key);

            if (value != null) {
                return Optional.of(objectMapper.readValue(value, List.class));
            }
        } catch (Exception e) {
            log.error("Failed to get cached inputs for problem: {}", problemId, e);
        }
        return Optional.empty();
    }

    /**
     * Cache problem outputs
     */
    public void cacheProblemOutputs(String problemId, List<String> outputs) {
        try {
            String key = buildProblemOutputsKey(problemId);
            String value = objectMapper.writeValueAsString(outputs);
            redisTemplate.opsForValue().set(key, value, DEFAULT_CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.debug("Cached {} outputs for problem: {}", outputs.size(), problemId);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache outputs for problem: {}", problemId, e);
        }
    }

    /**
     * Get cached problem outputs
     */
    @SuppressWarnings("unchecked")
    public Optional<List<String>> getCachedProblemOutputs(String problemId) {
        try {
            String key = buildProblemOutputsKey(problemId);
            String value = (String) redisTemplate.opsForValue().get(key);

            if (value != null) {
                return Optional.of(objectMapper.readValue(value, List.class));
            }
        } catch (Exception e) {
            log.error("Failed to get cached outputs for problem: {}", problemId, e);
        }
        return Optional.empty();
    }

    /**
     * Invalidate all cached data for a problem
     */
    public void invalidateProblemCache(String problemId) {
        log.info("Invalidating cache for problem: {}", problemId);

        // Delete all language-specific caches
        for (LanguageId languageId : LanguageId.values()) {
            String detailsKey = buildProblemDetailsKey(problemId, languageId);
            String codeKey = buildProblemCodeKey(problemId, languageId);
            redisTemplate.delete(detailsKey);
            redisTemplate.delete(codeKey);
        }

        // Delete shared caches
        String inputsKey = buildProblemInputsKey(problemId);
        String outputsKey = buildProblemOutputsKey(problemId);
        redisTemplate.delete(inputsKey);
        redisTemplate.delete(outputsKey);
    }

    private String buildProblemDetailsKey(String problemId, LanguageId languageId) {
        return PROBLEM_DETAILS_PREFIX + problemId + ":" + languageId;
    }

    private String buildProblemCodeKey(String problemId, LanguageId languageId) {
        return PROBLEM_CODE_PREFIX + problemId + ":" + languageId;
    }

    private String buildProblemInputsKey(String problemId) {
        return PROBLEM_INPUTS_PREFIX + problemId;
    }

    private String buildProblemOutputsKey(String problemId) {
        return PROBLEM_OUTPUTS_PREFIX + problemId;
    }
}
