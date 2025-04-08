package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.contest.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ContestService {

    /** Creates a new contest with associated problems */
    ContestDetailDto createContest(CreateContestRequest request);

    /** Retrieves a paginated list of contest summaries */
    Page<ContestSummaryDto> getAllContests(Pageable pageable);

    /** Retrieves detailed information for a specific contest */
    ContestDetailDto getContestDetails(String contestId);

    /** Updates an existing contest */
    ContestDetailDto updateContest(String contestId, UpdateContestRequest request);

    /** Deletes a contest */
    void deleteContest(String contestId);

    /** Registers the current user for the contest */
    void registerUserForContest(String contestId);

    /** Retrieves the list of problems for a specific contest */
    List<ContestProblemDto> getContestProblems(String contestId);

    /** Retrieves the calculated scoreboard for a contest */
    List<ScoreboardEntryDto> getScoreboard(String contestId);
}
