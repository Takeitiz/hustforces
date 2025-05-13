package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.model.dto.profile.UserProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileCacheService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String USER_PROFILE_KEY_PREFIX = "user:profile:";
    private static final long CACHE_TTL_HOURS = 24;

    public void cacheUserProfile(String username, UserProfileDto profile) {
        try {
            String key = USER_PROFILE_KEY_PREFIX + username;
            String value = objectMapper.writeValueAsString(profile);
            redisTemplate.opsForValue().set(key, value, CACHE_TTL_HOURS, TimeUnit.HOURS);
            log.debug("Cached user profile for: {}", username);
        } catch (JsonProcessingException e) {
            log.error("Failed to cache user profile for: {}", username, e);
        }
    }

    public Optional<UserProfileDto> getCachedUserProfile(String username) {
        try {
            String key = USER_PROFILE_KEY_PREFIX + username;
            String value = (String) redisTemplate.opsForValue().get(key);

            if (value != null) {
                return Optional.of(objectMapper.readValue(value, UserProfileDto.class));
            }
        } catch (Exception e) {
            log.error("Failed to get cached user profile for: {}", username, e);
        }
        return Optional.empty();
    }

    public void invalidateCache(String username) {
        String key = USER_PROFILE_KEY_PREFIX + username;
        redisTemplate.delete(key);
        log.debug("Invalidated profile cache for: {}", username);
    }
}
