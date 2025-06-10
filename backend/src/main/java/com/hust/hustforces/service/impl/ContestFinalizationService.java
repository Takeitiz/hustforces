package com.hust.hustforces.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hust.hustforces.constants.ContestConstants;
import com.hust.hustforces.event.ContestCompletedEvent;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.ContestLeaderboardEntryDto;
import com.hust.hustforces.model.dto.contest.ProblemSubmissionStatusDto;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestFinalizationService {

    private final ContestRepository contestRepository;
    private final ContestPointsRepository contestPointsRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final UserStatsRepository userStatsRepository;
    private final LeaderboardService leaderboardService;
    private final RatingCalculationService ratingCalculationService;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    // Keep track of contests being processed to avoid duplicates
    private final Set<String> contestsBeingFinalized = ConcurrentHashMap.newKeySet();

    /**
     * Scheduled task to check and finalize ended contests
     * Runs every 2 minutes
     */
    @Scheduled(fixedDelay = 120000, initialDelay = 30000)
    public void checkAndFinalizeEndedContests() {
        log.debug("Checking for contests to finalize...");

        LocalDateTime now = LocalDateTime.now();

        // Find contests that ended in the last hour and are not finalized
        List<Contest> endedContests = contestRepository
                .findEndedUnfinalizedContests(now.minusHours(1), now);

        if (!endedContests.isEmpty()) {
            log.info("Found {} contests to finalize", endedContests.size());

            for (Contest contest : endedContests) {
                if (contestsBeingFinalized.add(contest.getId())) {
                    try {
                        finalizeContest(contest);
                    } catch (Exception e) {
                        log.error("Error finalizing contest {}: {}",
                                contest.getId(), e.getMessage(), e);
                        contest.setFinalizationError(e.getMessage());
                        contestRepository.save(contest);
                    } finally {
                        contestsBeingFinalized.remove(contest.getId());
                    }
                }
            }
        }
    }

    /**
     * Finalize a single contest
     */
    @Transactional
    public void finalizeContest(Contest contest) {
        log.info("Starting finalization for contest: {} ({})",
                contest.getTitle(), contest.getId());

        try {
            // Step 1: Get final leaderboard from Redis
            List<ContestLeaderboardEntryDto> leaderboard =
                    leaderboardService.getLeaderboard(contest.getId());

            if (leaderboard.isEmpty()) {
                log.warn("No participants found for contest {}, rebuilding from submissions",
                        contest.getId());
                // Rebuild leaderboard from submissions if Redis data is missing
                leaderboardService.rebuildLeaderboard(contest.getId());
                leaderboard = leaderboardService.getLeaderboard(contest.getId());
            }

            // Step 2: Persist leaderboard to database
            persistLeaderboardToDatabase(contest, leaderboard);

            // Step 3: Calculate rating changes
            Map<String, ContestCompletedEvent.RankData> rankings =
                    calculateAndSaveRatings(contest, leaderboard);

            // Step 4: Mark contest as finalized
            contest.setFinalized(true);
            contest.setFinalizedAt(LocalDateTime.now());
            contest.setTotalParticipants(leaderboard.size());
            contestRepository.save(contest);

            // Step 5: Mark as finalized in Redis
            leaderboardService.markContestFinalized(contest.getId());

            // Step 6: Publish event for other services
            eventPublisher.publishEvent(new ContestCompletedEvent(
                    contest.getId(),
                    contest.getTitle(),
                    rankings
            ));

            log.info("Successfully finalized contest {} with {} participants",
                    contest.getId(), leaderboard.size());

        } catch (Exception e) {
            log.error("Failed to finalize contest {}: {}", contest.getId(), e.getMessage(), e);
            throw new RuntimeException("Contest finalization failed", e);
        }
    }

    /**
     * Persist leaderboard data to database
     */
    private void persistLeaderboardToDatabase(Contest contest,
                                              List<ContestLeaderboardEntryDto> leaderboard) {
        log.info("Persisting leaderboard for contest {} with {} entries",
                contest.getId(), leaderboard.size());

        // Get all contest submissions for additional data
        Map<String, List<ContestSubmission>> submissionsByUser =
                contestSubmissionRepository.findAllByContestId(contest.getId())
                        .stream()
                        .collect(Collectors.groupingBy(ContestSubmission::getUserId));

        List<ContestPoints> contestPointsList = new ArrayList<>();

        for (ContestLeaderboardEntryDto entry : leaderboard) {
            try {
                // Get user's submissions
                List<ContestSubmission> userSubmissions =
                        submissionsByUser.getOrDefault(entry.getUserId(), Collections.emptyList());

                // Calculate total attempts
                int totalAttempts = userSubmissions.size();

                // Get last submission time
                LocalDateTime lastSubmissionTime = userSubmissions.stream()
                        .map(ContestSubmission::getCreatedAt)
                        .max(LocalDateTime::compareTo)
                        .orElse(contest.getStartTime());

                // Convert problem statuses to JSON
                String problemDetailsJson = objectMapper.writeValueAsString(
                        entry.getProblemStatuses()
                );

                // Create or update ContestPoints
                ContestPoints contestPoints = contestPointsRepository
                        .findByContestIdAndUserId(contest.getId(), entry.getUserId())
                        .orElse(ContestPoints.builder()
                                .contestId(contest.getId())
                                .userId(entry.getUserId())
                                .build());

                contestPoints.setPoints(entry.getTotalPoints());
                contestPoints.setRank(entry.getRank());
                contestPoints.setProblemsSolved(
                        (int) entry.getProblemStatuses().stream()
                                .filter(ProblemSubmissionStatusDto::isSolved)
                                .count()
                );
                contestPoints.setTotalAttempts(totalAttempts);
                contestPoints.setLastSubmissionTime(lastSubmissionTime);
                contestPoints.setProblemDetailsJson(problemDetailsJson);

                contestPointsList.add(contestPoints);

            } catch (Exception e) {
                log.error("Error saving contest points for user {} in contest {}: {}",
                        entry.getUserId(), contest.getId(), e.getMessage());
            }
        }

        // Batch save all contest points
        contestPointsRepository.saveAll(contestPointsList);
        log.info("Saved {} contest point entries", contestPointsList.size());
    }

    /**
     * Calculate and save rating changes
     */
    private Map<String, ContestCompletedEvent.RankData> calculateAndSaveRatings(
            Contest contest, List<ContestLeaderboardEntryDto> leaderboard) {

        log.info("Calculating rating changes for {} participants", leaderboard.size());

        // Get current ratings
        Map<String, UserStats> userStatsMap = getUserStatsMap(
                leaderboard.stream()
                        .map(ContestLeaderboardEntryDto::getUserId)
                        .collect(Collectors.toSet())
        );

        // Calculate rating changes
        Map<String, RatingCalculationService.RatingChange> ratingChanges =
                ratingCalculationService.calculateRatingChanges(contest, leaderboard);

        // Update ContestPoints with rating data
        Map<String, ContestCompletedEvent.RankData> rankings = new HashMap<>();

        for (Map.Entry<String, RatingCalculationService.RatingChange> entry :
                ratingChanges.entrySet()) {
            String userId = entry.getKey();
            RatingCalculationService.RatingChange change = entry.getValue();

            // Update ContestPoints
            contestPointsRepository.findByContestIdAndUserId(contest.getId(), userId)
                    .ifPresent(cp -> {
                        cp.setRatingBefore(change.oldRating());
                        cp.setRatingAfter(change.newRating());
                        cp.setRatingChange(change.change());
                        contestPointsRepository.save(cp);
                    });

            // Prepare event data
            ContestLeaderboardEntryDto leaderboardEntry = leaderboard.stream()
                    .filter(e -> e.getUserId().equals(userId))
                    .findFirst()
                    .orElse(null);

            if (leaderboardEntry != null) {
                rankings.put(userId, new ContestCompletedEvent.RankData(
                        leaderboardEntry.getRank(),
                        change.oldRating(),
                        change.newRating(),
                        change.change()
                ));
            }
        }

        log.info("Rating changes calculated for {} users", rankings.size());
        return rankings;
    }

    /**
     * Get user stats for rating calculation
     */
    private Map<String, UserStats> getUserStatsMap(Set<String> userIds) {
        List<UserStats> userStatsList = userStatsRepository.findAllById(userIds);

        Map<String, UserStats> userStatsMap = userStatsList.stream()
                .collect(Collectors.toMap(UserStats::getUserId, us -> us));

        // Create default stats for users without stats
        for (String userId : userIds) {
            userStatsMap.computeIfAbsent(userId, id -> {
                UserStats newStats = new UserStats();
                newStats.setUserId(id);
                newStats.setCurrentRank(ContestConstants.DEFAULT_RATING);
                newStats.setMaxRank(ContestConstants.DEFAULT_RATING);
                return newStats;
            });
        }

        return userStatsMap;
    }

    /**
     * Manually finalize a contest (for admin use)
     */
    @Transactional
    public void manuallyFinalizeContest(String contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        if (contest.isFinalized()) {
            throw new IllegalStateException("Contest is already finalized");
        }

        if (contest.getEndTime().isAfter(LocalDateTime.now())) {
            log.warn("Manually finalizing contest {} before its end time", contestId);
        }

        finalizeContest(contest);
    }
}