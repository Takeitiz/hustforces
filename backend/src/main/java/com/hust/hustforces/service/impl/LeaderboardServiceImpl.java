package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardServiceImpl implements LeaderboardService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    private static final String CONTEST_SCORES_PREFIX = "contest:scores:";
    private static final String USER_PROBLEMS_PREFIX = "user:problems:";
    private static final String PROBLEM_ATTEMPTS_PREFIX = "problem:attempts:";

    @Override
    public int updateUserScore(String contestId, String userId, String problemId, int points, String submissionId) {
        log.info("Updating score for user {} in contest {} for problem {}: {} points",
                userId, contestId, problemId, points);

        // Validate contest exists
        contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        // Get user details
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Update redis score
        String scoreKey = CONTEST_SCORES_PREFIX + contestId;
        Double currentScore = redisTemplate.opsForZSet().score(scoreKey, userId);
        int totalPoints = points;

        return 0;
    }

    @Override
    public List<ContestLeaderboardEntryDto> getLeaderboard(String contestId) {
        return List.of();
    }

    @Override
    public ContestLeaderboardEntryDto getUserRanking(String contestId, String userId) {
        return null;
    }

    @Override
    public Map<String, ProblemSubmissionStatusDto> getUserProblemStatuses(String contestId, String userId) {
        return Map.of();
    }

    @Override
    public void initializeLeaderboard(String contestId) {

    }

    @Override
    public void rebuildLeaderboard(String contestId) {

    }

    @Override
    public void incrementAttemptCount(String contestId, String userId, String problemId) {

    }
}
