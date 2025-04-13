package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.service.PointsService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
@AllArgsConstructor
public class PointsServiceImpl implements PointsService {

    // Define point values by difficulty
    private static final Map<Difficulty, Integer> POINT_MAPPING = Map.of(
            Difficulty.EASY, 250,
            Difficulty.MEDIUM, 500,
            Difficulty.HARD, 1000
    );

    // Default points if difficulty is not found
    private static final int DEFAULT_POINTS = 250;

    @Override
    public double calculatePoints(String contestId, String userId, String problemId, Difficulty difficulty, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        // Convert to epoch millis for time calculations
        long startTimeMillis = startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long endTimeMillis = endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long nowMillis = now.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        long timeDiff = Math.abs(endTimeMillis - startTimeMillis);

        // Get points value for difficulty level, using default if not found
        int points = POINT_MAPPING.getOrDefault(difficulty, DEFAULT_POINTS);

        // Calculate points based on time remaining (more time = more points)
        // Formula: (timeRemaining/totalTime) * basePoints/2 + basePoints/2
        return ((double) (endTimeMillis - nowMillis) / timeDiff * points) / 2 + (double) points / 2;
    }
}