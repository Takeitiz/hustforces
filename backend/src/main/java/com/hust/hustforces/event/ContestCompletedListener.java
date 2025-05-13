package com.hust.hustforces.event;

import com.hust.hustforces.model.entity.RankingHistory;
import com.hust.hustforces.model.entity.UserStats;
import com.hust.hustforces.repository.RankingHistoryRepository;
import com.hust.hustforces.repository.UserRepository;
import com.hust.hustforces.repository.UserStatsRepository;
import com.hust.hustforces.service.impl.UserProfileCacheService;
import com.hust.hustforces.service.impl.UserStatsCalculationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ContestCompletedListener {
    private final RankingHistoryRepository rankingHistoryRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserProfileCacheService cacheService;
    private final UserRepository userRepository;

    @EventListener
    @Transactional
    public void handleContestCompletedEvent(ContestCompletedEvent event) {
        log.info("Processing rankings for completed contest: {}", event.getContestId());

        List<RankingHistory> rankings = new ArrayList<>();

        // Process each participant's ranking
        event.getRankings().forEach((userId, rankData) -> {
            // Create ranking history entry
            RankingHistory rankingEntry = RankingHistory.builder()
                    .userId(userId)
                    .contestId(event.getContestId())
                    .contestName(event.getContestName())
                    .rank(rankData.getRank())
                    .rating(rankData.getNewRating())
                    .ratingChange(rankData.getRatingChange())
                    .build();

            rankings.add(rankingEntry);

            // Update user stats
            UserStats stats = userStatsRepository.findById(userId)
                    .orElse(new UserStats());
            stats.setUserId(userId);
            stats.setCurrentRank(rankData.getNewRating());
            stats.setMaxRank(Math.max(stats.getMaxRank(), rankData.getNewRating()));
            stats.setContests(stats.getContests() + 1);
            userStatsRepository.save(stats);

            // Invalidate cache
            userRepository.findById(userId)
                    .ifPresent(user -> cacheService.invalidateCache(user.getUsername()));
        });

        // Save all ranking entries
        rankingHistoryRepository.saveAll(rankings);
    }
}
