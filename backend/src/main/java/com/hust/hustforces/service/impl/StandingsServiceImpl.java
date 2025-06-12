package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.standings.*;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.model.entity.UserBadge;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.UserBadgeRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import com.hust.hustforces.service.StandingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StandingsServiceImpl implements StandingsService {

    private final UserStatsRepository userStatsRepository;
    private final UserRepository userRepository;
    private final UserBadgeRepository userBadgeRepository;

    @Override
    public StandingResponseDto getStandings(int page, int size, StandingFilter filter) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserStats> statsPage;

        LocalDateTime startDate = getStartDateForTimeRange(filter.getTimeRange());

        switch (filter.getCategory()) {
            case "problems":
                statsPage = userStatsRepository
                        .findAllByLastActiveAfterOrderByProblemsSolvedDesc(startDate, pageable);
                break;
            case "contests":
                statsPage = userStatsRepository
                        .findAllByLastActiveAfterOrderByRatingDesc(startDate, pageable);
                break;
            default: // overall
                statsPage = userStatsRepository
                        .findAllByLastActiveAfterOrderByRatingDesc(startDate, pageable);
        }

        List<StandingUserDto> users = new ArrayList<>();
        int rank = page * size + 1;

        for (UserStats stats : statsPage.getContent()) {
            users.add(convertToDto(stats, rank++));
        }

        return StandingResponseDto.builder()
                .users(users)
                .totalUsers(statsPage.getTotalElements())
                .page(page)
                .pageSize(size)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    @Override
    public StandingResponseDto searchUsers(String query, StandingFilter filter) {
        LocalDateTime startDate = getStartDateForTimeRange(filter.getTimeRange());

        // Search users by username
        List<User> users = userRepository.findByUsernameContainingIgnoreCase(query);
        List<StandingUserDto> standingUsers = new ArrayList<>();

        for (User user : users) {
            UserStats stats = userStatsRepository
                    .findByUserId(user.getId())
                    .orElse(createDefaultStatistics(user));

            // Filter by last active date
            if (stats.getLastCalculated().isBefore(startDate)) {
                continue;
            }

            int rank = calculateUserRank(stats, filter.getCategory());
            standingUsers.add(convertToDto(stats, rank));
        }

        // Sort based on category
        switch (filter.getCategory()) {
            case "problems":
                standingUsers.sort((a, b) ->
                        Integer.compare(b.getProblemsSolved(), a.getProblemsSolved()));
                break;
            case "contests":
                standingUsers.sort((a, b) ->
                        Integer.compare(b.getContestsAttended(), a.getContestsAttended()));
                break;
            default: // overall - sort by rating
                standingUsers.sort((a, b) ->
                        Integer.compare(b.getRating(), a.getRating()));
        }

        // Re-assign ranks after sorting
        for (int i = 0; i < standingUsers.size(); i++) {
            standingUsers.get(i).setRank(i + 1);
        }

        return StandingResponseDto.builder()
                .users(standingUsers)
                .totalUsers(standingUsers.size())
                .page(0)
                .pageSize(standingUsers.size())
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    @Override
    public UserRankDetailsDto getUserRank(String userId) {
        UserStats stats = userStatsRepository
                .findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User statistics not found", "Statistic", userId));

        int globalRank = userStatsRepository.findUserRankByRating(userId);
        long totalUsers = userStatsRepository.count();
        double percentile = ((double)(totalUsers - globalRank + 1) / totalUsers) * 100;

        return UserRankDetailsDto.builder()
                .globalRank(globalRank)
                .percentile(percentile)
                .trend(calculateTrend(stats))
                .trendValue(stats.getRatingChange())
                .build();
    }

    @Override
    public StandingResponseDto getTopPerformers(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        Page<UserStats> topUsers = userStatsRepository
                .findAllByOrderByRatingDesc(pageable);

        List<StandingUserDto> users = new ArrayList<>();
        int rank = 1;

        for (UserStats stats : topUsers.getContent()) {
            users.add(convertToDto(stats, rank++));
        }

        return StandingResponseDto.builder()
                .users(users)
                .totalUsers(users.size())
                .page(0)
                .pageSize(limit)
                .lastUpdated(LocalDateTime.now())
                .build();
    }

    private StandingUserDto convertToDto(UserStats stats, int rank) {
        User user = stats.getUser();
        if (user == null) {
            user = userRepository.findById(stats.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", "id", stats.getUserId()));
        }

        double acceptanceRate = stats.getTotalSubmissions() > 0
                ? (double) stats.getAcceptedSubmissions() / stats.getTotalSubmissions() * 100
                : 0;

        return StandingUserDto.builder()
                .rank(rank)
                .userId(String.valueOf(user.getId()))
                .username(user.getUsername())
                .profilePicture(null) // Add profile picture support if needed
                .problemsSolved(stats.getProblemsSolved())
                .contestsAttended(stats.getContests())
                .totalSubmissions(stats.getTotalSubmissions())
                .acceptanceRate(acceptanceRate)
                .rating(stats.getCurrentRank())
                .badges(getUserBadges(user.getId()))
                .lastActive(stats.getLastCalculated())
                .build();
    }

    private List<UserBadgeDto> getUserBadges(String userId) {
        List<UserBadge> userBadges = userBadgeRepository.findByUserIdWithBadges(userId);

        return userBadges.stream()
                .map(ub -> UserBadgeDto.builder()
                        .id(String.valueOf(ub.getBadge().getId()))
                        .name(ub.getBadge().getName())
                        .icon(ub.getBadge().getIcon())
                        .color(ub.getBadge().getColor())
                        .description(ub.getBadge().getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    private LocalDateTime getStartDateForTimeRange(String timeRange) {
        LocalDateTime now = LocalDateTime.now();
        switch (timeRange) {
            case "week":
                return now.minusWeeks(1);
            case "month":
                return now.minusMonths(1);
            case "year":
                return now.minusYears(1);
            default:
                return LocalDateTime.of(2000, 1, 1, 0, 0);
        }
    }

    private UserStats createDefaultStatistics(User user) {
        return UserStats.builder()
                .userId(user.getId())
                .problemsSolved(0)
                .totalSubmissions(0)
                .acceptedSubmissions(0)
                .contests(0)
                .currentRank(1200)
                .maxRank(1200)
                .lastCalculated(LocalDateTime.now())
                .build();
    }

    private int calculateUserRank(UserStats stats, String category) {
        switch (category) {
            case "problems":
                return userStatsRepository.findUserRankByProblemsSolved(stats.getUserId());
            default:
                return userStatsRepository.findUserRankByRating(stats.getUserId());
        }
    }

    private String calculateTrend(UserStats stats) {
        if (stats.getCurrentRank() > stats.getCurrentRank()) {
            return "up";
        } else if (stats.getCurrentRank() < stats.getCurrentRank()) {
            return "down";
        } else {
            return "stable";
        }
    }
}
