package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.UserRole;
import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.model.entity.*;
import com.hust.hustforces.repository.*;
import com.hust.hustforces.service.ContestService;
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
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final ContestPointsRepository contestPointsRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    @Override
    @Transactional
    public ContestDto createContest(CreateContestRequest request, String creatorId) {
        log.info("Creating contest with title: {}", request.getTitle());

        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", creatorId));

        if (creator.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can create contests");
        }

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new IllegalArgumentException("End time cannot be before start time");
        }

        Contest contest = Contest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .hidden(request.isHidden())
                .leaderboard(request.isLeaderboard())
                .build();

        Contest savedContest = contestRepository.save(contest);
        log.info("Contest created with ID: {}", savedContest.getId());

        List<ContestProblemInfoDto> problems = new ArrayList<>();
        int index = 0;

        for (ContestProblemDto problemDto : request.getProblems()) {
            Problem problem = problemRepository.findById(problemDto.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemDto.getProblemId()));

            int problemIndex = problemDto.getIndex() > 0 ? problemDto.getIndex() : index;

            ContestProblem contestProblem = ContestProblem.builder()
                    .contestId(savedContest.getId())
                    .problemId(problem.getId())
                    .index(problemIndex)
                    .id(UUID.randomUUID().toString())
                    .build();

            ContestProblem savedContestProblem = contestProblemRepository.save(contestProblem);

            problems.add(ContestProblemInfoDto.builder()
                    .id(savedContestProblem.getId())
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .index(problemIndex)
                    .solved(0)
                    .build());

            index++;
        }

        return ContestDto.builder()
                .id(savedContest.getId())
                .title(savedContest.getTitle())
                .description(savedContest.getDescription())
                .startTime(savedContest.getStartTime())
                .endTime(savedContest.getEndTime())
                .hidden(savedContest.isHidden())
                .leaderboard(savedContest.isLeaderboard())
                .createdAt(savedContest.getCreatedAt())
                .problems(problems)
                .status(determineContestStatus(savedContest))
                .build();
    }

    @Override
    @Transactional
    public ContestDto updateContest(String contestId, UpdateContestRequest request, String userId) {
        log.info("Updating contest with ID: {}", contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can update contests");
        }

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        contest.setTitle(request.getTitle());
        contest.setDescription(request.getDescription());
        contest.setStartTime(request.getStartTime());
        contest.setEndTime(request.getEndTime());
        contest.setHidden(request.isHidden());
        contest.setLeaderboard(request.isLeaderboard());

        Contest updatedContest = contestRepository.save(contest);
        log.info("Contest updated: {}", updatedContest.getId());

        List<ContestProblemInfoDto> problems = new ArrayList<>();

        if (request.getProblems() != null && !request.getProblems().isEmpty()) {
            List<ContestProblem> existingProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);
            contestProblemRepository.deleteAll(existingProblems);

            int index = 0;
            for (ContestProblemDto problemDto : request.getProblems()) {
                Problem problem = problemRepository.findById(problemDto.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", problemDto.getProblemId()));

                int problemIndex = problemDto.getIndex() > 0 ? problemDto.getIndex() : index;

                ContestProblem contestProblem = ContestProblem.builder()
                        .contestId(updatedContest.getId())
                        .problemId(problem.getId())
                        .index(problemIndex)
                        .id(UUID.randomUUID().toString())
                        .build();

                ContestProblem savedContestProblem = contestProblemRepository.save(contestProblem);

                problems.add(ContestProblemInfoDto.builder()
                        .id(savedContestProblem.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(problemIndex)
                        .solved(0)
                        .build());

                index++;
            }
        } else {
            List<ContestProblem> existingProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);

            for (ContestProblem cp : existingProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problems.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }
        }

        return ContestDto.builder()
                .id(updatedContest.getId())
                .title(updatedContest.getTitle())
                .description(updatedContest.getDescription())
                .startTime(updatedContest.getStartTime())
                .endTime(updatedContest.getEndTime())
                .hidden(updatedContest.isHidden())
                .leaderboard(updatedContest.isLeaderboard())
                .createdAt(updatedContest.getCreatedAt())
                .problems(problems)
                .status(determineContestStatus(updatedContest))
                .build();
    }

    @Override
    @Transactional
    public void deleteContest(String contestId, String userId) {
        log.info("Deleting contest with ID: {}", contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can delete contests");
        }

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        contestRepository.delete(contest);
        log.info("Contest deleted: {}", contestId);
    }

    @Override
    public ContestDetailDto getContestDetails(String contestId, String userId) {
        log.info("Getting details for contest with ID: {}", contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        if (contest.isHidden() && user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Contest not found or not available");
        }

        List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contestId);
        List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

        for (ContestProblem cp : contestProblems) {
            Problem problem = problemRepository.findById(cp.getProblemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

            problemInfoDtos.add(ContestProblemInfoDto.builder()
                    .id(cp.getId())
                    .problemId(problem.getId())
                    .title(problem.getTitle())
                    .index(cp.getIndex())
                    .solved(cp.getSolved())
                    .build());
        }

        List<ContestLeaderboardEntryDto> leaderboard = new ArrayList<>();

        if (contest.isLeaderboard() &&
                (contest.getEndTime().isBefore(LocalDateTime.now()) || contest.getStartTime().isBefore(LocalDateTime.now()))) {

            List<ContestPoints> contestPointsList = contestPointsRepository.findByContestIdOrderByRankAsc(contestId);

            for (ContestPoints cp : contestPointsList) {
                User participant = userRepository.findById(cp.getUserId())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "id", cp.getUserId()));

                List<ContestSubmission> userSubmissions = contestSubmissionRepository
                        .findByContestIdAndUserIdOrderByPointsDesc(contestId, participant.getId());

                List<ProblemSubmissionStatusDto> problemStatuses = new ArrayList<>();

                for (ContestProblem problem : contestProblems) {
                    Optional<ContestSubmission> submission = userSubmissions.stream()
                            .filter(s -> s.getProblemId().equals(problem.getProblemId()))
                            .findFirst();

                    if (submission.isPresent()) {
                        ContestSubmission cs = submission.get();

                        List<Submission> allSubmissions = submissionRepository
                                .findByUserIdAndProblemIdAndActiveContestId(participant.getId(), problem.getProblemId(), contestId);

                        problemStatuses.add(ProblemSubmissionStatusDto.builder()
                                .problemId(problem.getProblemId())
                                .points(cs.getPoints())
                                .attempts(allSubmissions.size())
                                .submissionId(cs.getSubmissionId())
                                .solved(true)
                                .build());
                    } else {
                        List<Submission> attempts = submissionRepository
                                .findByUserIdAndProblemIdAndActiveContestId(participant.getId(), problem.getProblemId(), contestId);

                        problemStatuses.add(ProblemSubmissionStatusDto.builder()
                                .problemId(problem.getProblemId())
                                .points(0)
                                .attempts(attempts.size())
                                .submissionId(null)
                                .solved(false)
                                .build());
                    }
                }

                leaderboard.add(ContestLeaderboardEntryDto.builder()
                        .userId(participant.getId())
                        .username(participant.getUsername())
                        .rank(cp.getRank())
                        .totalPoints(cp.getPoints())
                        .problemStatuses(problemStatuses)
                        .build());
            }
        }

        return ContestDetailDto.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .description(contest.getDescription())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .hidden(contest.isHidden())
                .leaderboard(contest.isLeaderboard())
                .createdAt(contest.getCreatedAt())
                .status(determineContestStatus(contest))
                .problems(problemInfoDtos)
                .leaderboard(leaderboard)
                .build();
    }

    @Override
    public Page<ContestDto> getAllContests(Pageable pageable) {
        log.info("Getting all visible contests");

        Page<Contest> contests = contestRepository.findAllVisibleContests(pageable);

        return contests.map(contest -> {
            List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contest.getId());
            List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

            for (ContestProblem cp : contestProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problemInfoDtos.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }

            return ContestDto.builder()
                    .id(contest.getId())
                    .title(contest.getTitle())
                    .description(contest.getDescription())
                    .startTime(contest.getStartTime())
                    .endTime(contest.getEndTime())
                    .hidden(contest.isHidden())
                    .leaderboard(contest.isLeaderboard())
                    .createdAt(contest.getCreatedAt())
                    .problems(problemInfoDtos)
                    .status(determineContestStatus(contest))
                    .build();
        });
    }

    @Override
    public List<ContestDto> getActiveContests() {
        log.info("Getting active contests");

        List<Contest> activeContests = contestRepository.findActiveContests(LocalDateTime.now());

        return activeContests.stream().map(contest -> {
            List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contest.getId());
            List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

            for (ContestProblem cp : contestProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problemInfoDtos.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }

            return ContestDto.builder()
                    .id(contest.getId())
                    .title(contest.getTitle())
                    .description(contest.getDescription())
                    .startTime(contest.getStartTime())
                    .endTime(contest.getEndTime())
                    .hidden(contest.isHidden())
                    .leaderboard(contest.isLeaderboard())
                    .createdAt(contest.getCreatedAt())
                    .problems(problemInfoDtos)
                    .status(ContestStatus.ACTIVE)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<ContestDto> getUpcomingContests() {
        log.info("Getting upcoming contests");

        List<Contest> upcomingContests = contestRepository.findUpcomingContests(LocalDateTime.now());

        return upcomingContests.stream().map(contest -> {
            List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contest.getId());
            List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

            for (ContestProblem cp : contestProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problemInfoDtos.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }

            return ContestDto.builder()
                    .id(contest.getId())
                    .title(contest.getTitle())
                    .description(contest.getDescription())
                    .startTime(contest.getStartTime())
                    .endTime(contest.getEndTime())
                    .hidden(contest.isHidden())
                    .leaderboard(contest.isLeaderboard())
                    .createdAt(contest.getCreatedAt())
                    .problems(problemInfoDtos)
                    .status(ContestStatus.UPCOMING)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public Page<ContestDto> getPastContests(Pageable pageable) {
        log.info("Getting past contests");

        Page<Contest> pastContests = contestRepository.findPastContests(LocalDateTime.now(), pageable);

        return pastContests.map(contest -> {
            List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contest.getId());
            List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

            for (ContestProblem cp : contestProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problemInfoDtos.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }

            return ContestDto.builder()
                    .id(contest.getId())
                    .title(contest.getTitle())
                    .description(contest.getDescription())
                    .startTime(contest.getStartTime())
                    .endTime(contest.getEndTime())
                    .hidden(contest.isHidden())
                    .leaderboard(contest.isLeaderboard())
                    .createdAt(contest.getCreatedAt())
                    .problems(problemInfoDtos)
                    .status(ContestStatus.ENDED)
                    .build();
        });
    }

    @Override
    public Page<ContestDto> searchContests(String query, Pageable pageable) {
        log.info("Searching contests with query: {}", query);

        Page<Contest> searchResults = contestRepository.searchContests(query, pageable);

        return searchResults.map(contest -> {
            List<ContestProblem> contestProblems = contestProblemRepository.findByContestIdOrderByIndex(contest.getId());
            List<ContestProblemInfoDto> problemInfoDtos = new ArrayList<>();

            for (ContestProblem cp : contestProblems) {
                Problem problem = problemRepository.findById(cp.getProblemId())
                        .orElseThrow(() -> new ResourceNotFoundException("Problem", "id", cp.getProblemId()));

                problemInfoDtos.add(ContestProblemInfoDto.builder()
                        .id(cp.getId())
                        .problemId(problem.getId())
                        .title(problem.getTitle())
                        .index(cp.getIndex())
                        .solved(cp.getSolved())
                        .build());
            }

            return ContestDto.builder()
                    .id(contest.getId())
                    .title(contest.getTitle())
                    .description(contest.getDescription())
                    .startTime(contest.getStartTime())
                    .endTime(contest.getEndTime())
                    .hidden(contest.isHidden())
                    .leaderboard(contest.isLeaderboard())
                    .createdAt(contest.getCreatedAt())
                    .problems(problemInfoDtos)
                    .status(determineContestStatus(contest))
                    .build();
        });
    }

    @Override
    public ContestRegistrationDto registerForContest(String contestId, String userId) {
        log.info("Registering user {} for contest {}", userId, contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        if (contest.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot register for ended contests");
        }

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

    @Override
    public void updateLeaderboard(String contestId) {
        log.info("Updating leaderboard for contest: {}", contestId);

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        List<ContestSubmission> allSubmissions = contestSubmissionRepository.findAllByContestId(contestId);

        Map<String, List<ContestSubmission>> submissionsByUser = allSubmissions.stream()
                .collect(Collectors.groupingBy(ContestSubmission::getUserId));

        List<ContestPoints> userPoints = new ArrayList<>();

        for (Map.Entry<String, List<ContestSubmission>> entry : submissionsByUser.entrySet()) {
            String userId = entry.getKey();
            List<ContestSubmission> userSubmissions = entry.getValue();

            int totalPoints = userSubmissions.stream()
                    .mapToInt(ContestSubmission::getPoints)
                    .sum();

            ContestPoints points = contestPointsRepository.findByContestIdAndUserId(contestId, userId)
                    .orElseGet(() -> ContestPoints.builder()
                            .contestId(contestId)
                            .userId(userId)
                            .build());

            points.setPoints(totalPoints);
            userPoints.add(points);
        }

        userPoints.sort(Comparator.comparing(ContestPoints::getPoints).reversed());

        int currentRank = 1;
        int sameRankCount = 0;
        Integer lastPoints = null;

        for (ContestPoints points : userPoints) {
            if (lastPoints != null && !lastPoints.equals(points.getPoints())) {
                currentRank += sameRankCount;
                sameRankCount = 1;
            } else {
                sameRankCount++;
            }

            points.setRank(currentRank);
            lastPoints = points.getPoints();
        }

        contestPointsRepository.saveAll(userPoints);
        log.info("Leaderboard updated for contest: {}", contestId);
    }

    @Override
    @Transactional
    public void addProblemToContest(String contestId, String problemId, int index, String userId) {
        log.info("Adding problem {} to contest {} at index {}", problemId, contestId, index);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can modify contests");
        }

        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        Problem problem = problemRepository.findById(problemId)
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
        log.info("Problem added to contest successfully");
    }

    @Override
    @Transactional
    public void removeProblemFromContest(String contestId, String problemId, String userId) {
        log.info("Removing problem {} from contest {}", problemId, contestId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only administrators can modify contests");
        }

        ContestProblem contestProblem = contestProblemRepository.findByContestIdAndProblemId(contestId, problemId)
                .orElseThrow(() -> new ResourceNotFoundException("ContestProblem", "contestId_problemId", contestId + "_" + problemId));

        contestProblemRepository.delete(contestProblem);
        log.info("Problem removed from contest successfully");
    }

    @Override
    public boolean isContestActive(String contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

        LocalDateTime now = LocalDateTime.now();
        return !contest.isHidden() && contest.getStartTime().isBefore(now) && contest.getEndTime().isAfter(now);
    }

    @Override
    public boolean canViewContestProblems(String contestId, String userId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest", "id", contestId));

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

    private ContestStatus determineContestStatus(Contest contest) {
        LocalDateTime now = LocalDateTime.now();

        if (contest.getEndTime().isBefore(now)) {
            return ContestStatus.ENDED;
        } else if (contest.getStartTime().isBefore(now)) {
            return ContestStatus.ACTIVE;
        } else {
            return ContestStatus.UPCOMING;
        }
    }
}
