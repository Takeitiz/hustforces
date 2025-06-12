package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.entity.Badge;
import com.hust.hustforces.model.entity.UserBadge;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.BadgeRepository;
import com.hust.hustforces.repository.UserBadgeRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadgeService {

    private final UserStatsRepository userStatsRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    @Scheduled(cron = "0 0 * * * *") // Run every hour
    @Transactional
    public void checkAndAwardBadges() {
        log.info("Checking for badge awards...");

        // Get all badges
        List<Badge> badges = badgeRepository.findAll();

        for (Badge badge : badges) {
            switch (badge.getName()) {
                case "Problem Solver":
                    awardProblemSolverBadge(badge);
                    break;
                case "Contest Master":
                    awardContestMasterBadge(badge);
                    break;
                case "Rising Star":
                    awardRisingStarBadge(badge);
                    break;
                // Add more badge checks as needed
            }
        }
    }

    private void awardProblemSolverBadge(Badge badge) {
        List<UserStats> eligibleUsers = userStatsRepository
                .findAllByProblemsSolvedGreaterThanEqual(100);

        for (UserStats stats : eligibleUsers) {
            awardBadgeIfNotExists(stats.getUserId(), badge);
        }
    }

    private void awardContestMasterBadge(Badge badge) {
        List<UserStats> eligibleUsers = userStatsRepository
                .findAllByContestsGreaterThanEqual(50);

        for (UserStats stats : eligibleUsers) {
            awardBadgeIfNotExists(stats.getUserId(), badge);
        }
    }

    private void awardRisingStarBadge(Badge badge) {
        List<UserStats> eligibleUsers = userStatsRepository
                .findAllByRatingIncreaseGreaterThanEqual(500);

        for (UserStats stats : eligibleUsers) {
            awardBadgeIfNotExists(stats.getUserId(), badge);
        }
    }

    private void awardBadgeIfNotExists(String userId, Badge badge) {
        if (!userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) {
            UserBadge userBadge = UserBadge.builder()
                    .userId(userId)
                    .badgeId(badge.getId())
                    .awardedAt(LocalDateTime.now())
                    .build();

            userBadgeRepository.save(userBadge);
            log.info("Awarded '{}' badge to user {}", badge.getName(), userId);
        }
    }
}
