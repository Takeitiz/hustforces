package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.service.PointsService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;

@Service
@AllArgsConstructor
public class PointsServiceImpl implements PointsService {

    private static final Map<String, Integer> POINT_MAPPING = Map.of(
            "EASY", 250,
            "MEDIUM", 500,
            "HARD", 1000
    );

    @Override
    public double calculatePoints(String contestId, String userId, String problemId, Difficulty difficulty, LocalDateTime startTime, LocalDateTime endTime) {
        LocalDateTime now = LocalDateTime.now();

        long startTimeMillis = startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long endTimeMillis = endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long nowMillis = now.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        long timeDiff = Math.abs(endTimeMillis - startTimeMillis);
        Integer points = POINT_MAPPING.getOrDefault(difficulty.name(), POINT_MAPPING.get("EASY"));

        if (points == null) return 0;

        return ((double) (endTimeMillis - nowMillis) / timeDiff * points) / 2 + (double) points / 2;
    }
}
