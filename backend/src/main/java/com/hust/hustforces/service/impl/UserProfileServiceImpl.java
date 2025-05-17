package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.UserMapper;
import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.profile.RankingHistoryDto;
import com.hust.hustforces.model.dto.profile.SubmissionHistoryDto;
import com.hust.hustforces.model.dto.profile.UserProfileDto;
import com.hust.hustforces.model.dto.profile.UserStatsDto;
import com.hust.hustforces.model.entity.RankingHistory;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.RankingHistoryRepository;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import com.hust.hustforces.service.UserProfileService;
import com.hust.hustforces.utils.RatingUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final UserStatsRepository userStatsRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final UserProfileCacheService cacheService;
    private final UserStatsCalculationService statsCalculationService;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    @Override
    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // First check cache
        Optional<UserProfileDto> cachedProfile = cacheService.getCachedUserProfile(username);
        if (cachedProfile.isPresent()) {
            log.debug("Cache hit for user profile: {}", username);
            return cachedProfile.get();
        }

        log.debug("Cache miss for user profile: {}, building profile", username);
        UserProfileDto profile = buildUserProfile(user);

        // Cache the result
        cacheService.cacheUserProfile(username, profile);

        return profile;
    }

    @Override
    public UserProfileDto getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return getUserProfile(username);
    }

    private UserProfileDto buildUserProfile(User user) {
        // Get pre-calculated stats
        UserStats stats = userStatsRepository.findById(user.getId())
                .orElseGet(() -> {
                    // If stats don't exist, calculate them now
                    statsCalculationService.updateUserStats(user.getId());
                    return userStatsRepository.findById(user.getId())
                            .orElseThrow(() -> new RuntimeException("Failed to create user stats"));
                });

        // Parse JSON data from stats
        Map<Difficulty, Integer> problemsByDifficulty = parseJsonMap(
                stats.getProblemsByDifficultyJson(),
                new TypeReference<Map<Difficulty, Integer>>() {});

        Map<String, Integer> submissionCalendar = parseJsonMap(
                stats.getSubmissionCalendarJson(),
                new TypeReference<Map<String, Integer>>() {});

        // Build stats DTO
        UserStatsDto statsDto = UserStatsDto.builder()
                .totalSubmissions(stats.getTotalSubmissions())
                .acceptedSubmissions(stats.getAcceptedSubmissions())
                .problemsSolved(stats.getProblemsSolved())
                .contests(stats.getContests())
                .currentRank(stats.getCurrentRank())
                .maxRank(stats.getMaxRank())
                .build();

        // Get rating title
        RatingUtils.RatingTitle ratingTitle = RatingUtils.getTitleForRating(stats.getCurrentRank());

        // Get recent submissions (need fresh data)
        List<SubmissionHistoryDto> recentSubmissions = getRecentSubmissions(user.getId());

        // Get ranking history (need fresh data)
        List<RankingHistoryDto> rankingHistory = getRankingHistory(user.getId());

        UserDto userDto = userMapper.toUserDto(user);

        return UserProfileDto.builder()
                .user(userDto)
                .stats(statsDto)
                .recentSubmissions(recentSubmissions)
                .rankingHistory(rankingHistory)
                .submissionCalendar(submissionCalendar)
                .problemsSolvedByDifficulty(problemsByDifficulty)
                .ratingTitle(ratingTitle.getTitle())
                .ratingColor(ratingTitle.getColor())
                .build();
    }

    private <T> T parseJsonMap(String json, TypeReference<T> typeRef) {
        if (json == null || json.isEmpty()) {
            return (T) new HashMap<String, Integer>();
        }

        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            log.error("Error parsing JSON: {}", e.getMessage());
            return (T) new HashMap<String, Integer>();
        }
    }

    private List<SubmissionHistoryDto> getRecentSubmissions(String userId) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Submission> submissions = submissionRepository.findRecentSubmissionsByUserId(userId, pageable);

        return submissions.stream()
                .map(s -> SubmissionHistoryDto.builder()
                        .id(s.getId())
                        .problemId(s.getProblemId())
                        .problemTitle(s.getProblem().getTitle())
                        .status(s.getStatus().toString())
                        .languageId(String.valueOf(s.getLanguageId()))
                        .createdAt(s.getCreatedAt().toString())
                        .build())
                .collect(Collectors.toList());
    }

    private List<RankingHistoryDto> getRankingHistory(String userId) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<RankingHistory> historyEntries = rankingHistoryRepository.findRecentByUserId(userId, pageable);

        if (historyEntries.isEmpty()) {
            // Fallback to mock data if no history entries exist yet
            // This should be removed once you have real ranking data
            return generateMockRankingHistory();
        }

        return historyEntries.stream()
                .map(entry -> RankingHistoryDto.builder()
                        .date(entry.getCreatedAt().toLocalDate().toString())
                        .rank(entry.getRank())
                        .rating(entry.getRating())
                        .contestId(entry.getContestId())
                        .contestName(entry.getContestName())
                        .build())
                .collect(Collectors.toList());
    }

    // TODO: Remove this mock data generator once real ranking data is available
    private List<RankingHistoryDto> generateMockRankingHistory() {
        List<RankingHistoryDto> history = new ArrayList<>();
        LocalDate date = LocalDate.now().minusDays(60);
        int rank = 1500;

        for (int i = 0; i < 10; i++) {
            date = date.plusDays(6);
            rank += (int) (Math.random() * 100) - 50;

            history.add(RankingHistoryDto.builder()
                    .date(date.toString())
                    .rank(rank)
                    .rating(rank)
                    .contestId("contest-" + (i + 1))
                    .contestName("Weekly Contest " + (i + 1))
                    .build());
        }

        return history;
    }
}