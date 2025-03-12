package com.hust.hustforces.service;

import com.hust.hustforces.enums.Difficulty;

import java.time.LocalDateTime;
import java.util.Date;

public interface PointsService {
    public double calculatePoints(String contestId, String userId, String problemId, Difficulty difficulty, LocalDateTime startTime, LocalDateTime endTime);
}
