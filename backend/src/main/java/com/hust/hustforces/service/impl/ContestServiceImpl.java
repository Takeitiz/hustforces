package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.UserRole;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.mapper.ContestMapper;
import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.ContestService;
import com.hust.hustforces.service.LeaderboardService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestServiceImpl implements ContestService {

    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ContestPointsRepository contestPointsRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final LeaderboardService leaderboardService;
    private final ContestMapper contestMapper;

    /**
     * Create a new contest
     */
    @Override
    @Transactional
    public ContestDto createContest(CreateContestRequest request, String creatorId) {
        // Validate creator and permissions
        validateCreator(creatorId);
        validateContestTimes(request.getStartTime(), request.getEndTime());

        // Create and save contest
        Contest contest = buildContestFromRequest(request);
        Contest savedContest = contestRepository.save(contest);

        // Add problems to contest
        List<ContestProblemInfoDto> problems = addProblemsToContest(savedContest.getId(), request.getProblems());

        return contestMapper.toContestDto(savedContest, problems);
    }

    /**
     * Update existing contest
     */
    @Override
    @Transactional
    public ContestDto updateContest(String contestId, UpdateContestRequest request, String userId) {
        validateAdminPermission(userId);

        Contest contest = findContestById(contestId);
        updateContestFields(contest, request);

        Contest updatedContest = contestRepository.save(contest);

        List<ContestProblemInfoDto> problems;
        if (request.getProblems() != null && !request.getProblems().isEmpty()) {
            problems = updateContestProblems(contestId, request.getProblems());
        } else {
            problems = getExistingProblems(contestId);
        }

        return contestMapper.toContestDto(updatedContest, problems);
    }

    /**
     * Delete a contest
     */
    @Override
    @Transactional
    public void deleteContest(String contestId, String userId) {
        validateAdminPermission(userId);
        Contest contest = findContestById(contestId);
        contestRepository.delete(contest);
    }

    /**
     * Get contest details including problems and leaderboard
     */
    @Override
    public ContestDetailDto getContestDetails(String contestId, String userId) {
        Contest contest = findContestById(contestId);
        validateContestVisibility(contest, userId);

        List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contestId);
        List<ContestLeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(contestId);

        return contestMapper.toContestDetailDto(contest, problemInfoDtos, leaderboard);
    }

    /**
     * Get paginated list of all visible contests
     */
    @Override
    public Page<ContestDto> getAllContests(Pageable pageable) {
        Page<Contest> contests = contestRepository.findByHiddenFalseOrderByStartTimeDesc(pageable);

        return contests.map(contest -> {
            List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contest.getId());
            return contestMapper.toContestDto(contest, problemInfoDtos);
        });
    }

    /**
     * Get list of active contests
     */
    @Override
    public List<ContestDto> getActiveContests() {
        List<Contest> activeContests = contestRepository.findActiveContests(LocalDateTime.now());

        return activeContests.stream()
                .map(contest -> {
                    List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contest.getId());
                    return contestMapper.toContestDto(contest, problemInfoDtos);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get list of upcoming contests
     */
    @Override
    public List<ContestDto> getUpcomingContests() {
        List<Contest> upcomingContests = contestRepository.findUpcomingContests(LocalDateTime.now());

        return upcomingContests.stream()
                .map(contest -> {
                    List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contest.getId());
                    return contestMapper.toContestDto(contest, problemInfoDtos);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get paginated list of past contests
     */
    @Override
    public Page<ContestDto> getPastContests(Pageable pageable) {
        Page<Contest> pastContests = contestRepository.findPastContests(LocalDateTime.now(), pageable);

        return pastContests.map(contest -> {
            List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contest.getId());
            return contestMapper.toContestDto(contest, problemInfoDtos);
        });
    }

    /**
     * Search contests by title
     */
    @Override
    public Page<ContestDto> searchContests(String query, Pageable pageable) {
        Page<Contest> searchResults = contestRepository.searchContests(query, pageable);

        return searchResults.map(contest -> {
            List<ContestProblemInfoDto> problemInfoDtos = getContestProblems(contest.getId());
            return contestMapper.toContestDto(contest, problemInfoDtos);
        });
    }

    /**
     * Register a user for a contest
     */
    @Override
    public ContestRegistrationDto registerForContest(String contestId, String userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Contest contest = findContestById(contestId);
        validateContestRegistration(contest);

        Optional<ContestPoints> existingRegistration = contestPointsRepository.findByContestIdAndUserId(contestId, userId);

        if (existingRegistration.isPresent()) {
            throw new IllegalArgumentException("User is already registered for this contest");
        }

        ContestPoints registration = ContestPoints.builder()
                .contestId(contestId)
                .userId(userId)
                .points(0)
                .rank(0)
                .build();

        ContestPoints savedRegistration = contestPointsRepository.save(registration);

        return ContestRegistrationDto.builder()
                .contestId(contestId)
                .userId(userId)
                .registeredAt(savedRegistration.getCreatedAt())
                .build();
    }

    /**
     * Update contest leaderboard
     */
    @Override
    public void updateLeaderboard(String contestId) {
        leaderboardService.rebuildLeaderboard(contestId);
    }

    /**
     * Add a problem to a contest
     */
    @Override
    @Transactional
    public void addProblemToContest(String contestId, String problemId, int index, String userId) {
        validateAdminPermission(userId);

        findContestById(contestId);
        problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemId));

        Optional<ContestProblem> existingProblem = contestProblemRepository
                .findByContestIdAndProblemId(contestId, problemId);

        if (existingProblem.isPresent()) {
            throw new IllegalArgumentException("Problem is already in this contest");
        }

        ContestProblem contestProblem = ContestProblem.builder()
                .contestId(contestId)
                .problemId(problemId)
                .index(index)
                .id(UUID.randomUUID().toString())
                .build();

        contestProblemRepository.save(contestProblem);
    }

    /**
     * Remove a problem from a contest
     */
    @Override
    @Transactional
    public void removeProblemFromContest(String contestId, String problemId, String userId) {
        validateAdminPermission(userId);

        ContestProblem contestProblem = contestProblemRepository.findByContestIdAndProblemId(contestId, problemId)
                .orElseThrow(() -> new ResourceNotFoundException("ContestProblem", "contestId_problemId", contestId + "_" + problemId));

        contestProblemRepository.delete(contestProblem);
    }

    /**
     * Check if a contest is active
     */
    @Override
    public boolean isContestActive(String contestId) {
        Contest contest = findContestById(contestId);

        LocalDateTime now = LocalDateTime.now();
        return !contest.isHidden() && contest.getStartTime().isBefore(now) && contest.getEndTime().isAfter(now);
    }

    /**
     * Check if a user can view contest problems
     */
    @Override
    public boolean canViewContestProblems(String contestId, String userId) {
        Contest contest = findContestById(contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        if (isContestActive(contestId)) {
            return contestPointsRepository.findByContestIdAndUserId(contestId, userId).isPresent();
        }

        return contest.getEndTime().isBefore(LocalDateTime.now());
    }

    /**
     * Validate that the user is an admin
     */
    private void validateAdminPermission(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can perform this action");
        }
    }

    /**
     * Validate creator permissions
     */
    private void validateCreator(String creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", creatorId));

        if (creator.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can create contests");
        }
    }

    /**
     * Validate contest time range
     */
    private void validateContestTimes(LocalDateTime startTime, LocalDateTime endTime) {
        if (endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("End time cannot be before start time");
        }
    }

    /**
     * Validate contest registration
     */
    private void validateContestRegistration(Contest contest) {
        if (contest.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot register for ended contests");
        }
    }

    /**
     * Validate contest visibility for a user
     */
    private void validateContestVisibility(Contest contest, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (contest.isHidden() && user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Contest not found or not available");
        }
    }

    /**
     * Build contest entity from request
     */
    private Contest buildContestFromRequest(CreateContestRequest request) {
        return Contest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .hidden(request.isHidden())
                .leaderboard(request.isLeaderboard())
                .build();
    }

    /**
     * Update contest fields from request
     */
    private void updateContestFields(Contest contest, UpdateContestRequest request) {
        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setHidden(request.isHidden());
        contest.setLeaderboard(request.isLeaderboard());
    }

    /**
     * Find contest by ID
     */
    private Contest findContestById(String contestId) {
        return contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));
    }

    /**
     * Add problems to a contest
     */
    private List<ContestProblemInfoDto> addProblemsToContest(String contestId, List<ContestProblemDto> problemDtos) {
        List<ContestProblemInfoDto> result = new ArrayList<>();
        int index = 0;

        for (ContestProblemDto problemDto : problemDtos) {
            Problem problem = problemRepository.findById(problemDto.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemDto.getProblemId()));

            int problemIndex = problemDto.getIndex() > 0 ? problemDto.getIndex() : index;

            ContestProblem contestProblem = ContestProblem.builder()
                    .contestId(contestId)
                    .problemId(problem.getId())
                    .index(problemIndex)
                    .id(UUID.randomUUID().toString())
                    .build();

            ContestProblem savedContestProblem = contestProblemRepository.save(contestProblem);

            result.add(ContestProblemInfoDto.builder()
                    .id(savedContestProblem.getId())
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .index(problemIndex)
                    .solved(0)
                    .build());

            index++;
        }

        return result;
    }

    /**
     * Update problems in a contest
     */
    private List<ContestProblemInfoDto> updateContestProblems(String contestId, List<ContestProblemDto> problemDtos) {
        // Delete existing problems
        List<ContestProblem> existingProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);
        contestProblemRepository.deleteAll(existingProblems);

        // Add new problems
        return addProblemsToContest(contestId, problemDtos);
    }

    /**
     * Get existing problems for a contest
     */
    private List<ContestProblemInfoDto> getExistingProblems(String contestId) {
        List<ContestProblem> existingProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);
        List<ContestProblemInfoDto> result = new ArrayList<>();

        for (ContestProblem cp : existingProblems) {
            Problem problem = problemRepository.findById(cp.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

            result.add(ContestProblemInfoDto.builder()
                    .id(cp.getId())
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .index(cp.getIndex())
                    .solved(cp.getSolved())
                    .build());
        }

        return result;
    }

    /**
     * Get problems for a contest
     */
    private List<ContestProblemInfoDto> getContestProblems(String contestId) {
        List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);
        List<ContestProblemInfoDto> result = new ArrayList<>();

        for (ContestProblem cp : contestProblems) {
            Problem problem = problemRepository.findById(cp.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

            result.add(ContestProblemInfoDto.builder()
                    .id(cp.getId())
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .index(cp.getIndex())
                    .solved(cp.getSolved())
                    .build());
        }

        return result;
    }
}
