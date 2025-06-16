package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.contest.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ContestService {
    // Contest management
    ContestDto createContest(CreateContestRequest request, String creatorId);

    ContestDto updateContest(String contestId, UpdateContestRequest request, String userId);

    void deleteContest(String contestId, String userId);

    ContestDetailDto getContestDetails(String contestId, String userId);

    // Contest listings
    Page<ContestDto> getAllContests(Pageable pageable);

    List<ContestDto> getActiveContests();

    List<ContestDto> getUpcomingContests();

    Page<ContestDto> getPastContests(Pageable pageable);

    Page<ContestDto> searchContests(String query, Pageable pageable);

    Page<ContestDto> getAllContestsForAdmin(String search, Pageable pageable);

    // Contest participation
    ContestRegistrationDto registerForContest(String contestId, String userId);

    void updateLeaderboard(String contestId);

    // Contest problem management
    void addProblemToContest(String contestId, String problemId, int index, String userId);

    void removeProblemFromContest(String contestId, String problemId, String userId);

    // Contest status
    boolean isContestActive(String contestId);

    boolean canViewContestProblems(String contestId, String userId);
}
