package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.UserMapper;
import com.hust.hustforces.model.dto.UserDto;
import com.hust.hustforces.model.dto.profile.RankingHistoryDto;
import com.hust.hustforces.model.dto.profile.SubmissionHistoryDto;
import com.hust.hustforces.model.dto.profile.UserProfileDto;
import com.hust.hustforces.model.dto.profile.UserStatsDto;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final UserMapper userMapper;

    @Override
    public UserProfileDto getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return buildUserProfile(user);
    }

    @Override
    public UserProfileDto getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return buildUserProfile(user);
    }

    private UserProfileDto buildUserProfile(User user) {
        List<Submission> submissions = submissionRepository.findByUserId(user.getId());

        // Build submission calendar heatmap data
        Map<String, Integer> submissionCalendar = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        submissions.forEach(submission -> {
            String date = submission.getCreatedAt().format(formatter);
            submissionCalendar.put(date, submissionCalendar.getOrDefault(date, 0) + 1);
        });

        // Count problems solved by difficulty
        Map<Difficulty, Integer> problemsByDifficulty = new HashMap<>();
        Set<String> solvedProblemIds = new HashSet<>();

        submissions.stream()
                .filter(s -> s.getStatus() == SubmissionResult.AC)
                .forEach(s -> {
                    if (solvedProblemIds.add(s.getProblemId())) {
                        Difficulty difficulty = s.getProblem().getDifficulty();
                        problemsByDifficulty.put(difficulty, problemsByDifficulty.getOrDefault(difficulty, 0) + 1);
                    }
                });

        // Get recent submissions
        List<SubmissionHistoryDto> recentSubmissions = submissions.stream()
                .sorted(Comparator.comparing(Submission::getCreatedAt).reversed())
                .limit(10)
                .map(s -> SubmissionHistoryDto.builder()
                        .id(s.getId())
                        .problemId(s.getProblemId())
                        .problemTitle(s.getProblem().getTitle())
                        .status(s.getStatus().toString())
                        .languageId(String.valueOf(s.getLanguageId()))
                        .createdAt(s.getCreatedAt().toString())
                        .build())
                .toList();

        // Build user stats
        UserStatsDto stats = UserStatsDto.builder()
                .totalSubmissions(submissions.size())
                .acceptedSubmissions((int) submissions.stream()
                        .filter(s -> s.getStatus() == SubmissionResult.AC)
                        .count())
                .problemsSolved(solvedProblemIds.size())
                .contests(user.getContestPoints().size())
                .currentRank(1500) // Placeholder, implement rank feature later
                .maxRank(1500) // Placeholder
                .build();

        // Mock ranking history data (this would come from contest results in a real app)
        List<RankingHistoryDto> rankingHistory = generateMockRankingHistory();

        UserDto userDto = userMapper.toUserDto(user);

        return UserProfileDto.builder()
                .user(userDto)
                .stats(stats)
                .recentSubmissions(recentSubmissions)
                .rankingHistory(rankingHistory)
                .submissionCalendar(submissionCalendar)
                .problemsSolvedByDifficulty(problemsByDifficulty)
                .build();
    }

    // Generate mock ranking history data for demonstration
    private List<RankingHistoryDto> generateMockRankingHistory() {
        List<RankingHistoryDto> history = new ArrayList<>();
        LocalDate date = LocalDate.now().minusDays(60);
        int rank = 1500;

        for (int i = 0; i < 10; i++) {
            date = date.plusDays(6);
            // Simulate some random rank changes
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
