package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.service.ContestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestServiceImpl implements ContestService {
    @Override
    public ContestDetailDto createContest(CreateContestRequest request) {
        return null;
    }

    @Override
    public Page<ContestSummaryDto> getAllContests(Pageable pageable) {
        return null;
    }

    @Override
    public ContestDetailDto getContestDetails(String contestId) {
        return null;
    }

    @Override
    public ContestDetailDto updateContest(String contestId, UpdateContestRequest request) {
        return null;
    }

    @Override
    public void deleteContest(String contestId) {

    }

    @Override
    public void registerUserForContest(String contestId) {

    }

    @Override
    public List<ContestProblemDto> getContestProblems(String contestId) {
        return List.of();
    }

    @Override
    public List<ScoreboardEntryDto> getScoreboard(String contestId) {
        return List.of();
    }
}
