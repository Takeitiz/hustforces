package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.standings.StandingFilter;
import com.hust.hustforces.model.dto.standings.StandingResponseDto;
import com.hust.hustforces.model.dto.standings.UserRankDetailsDto;

public interface StandingsService {
    StandingResponseDto getStandings(int page, int size, StandingFilter filter);
    StandingResponseDto searchUsers(String query, StandingFilter filter);
    UserRankDetailsDto getUserRank(String userId);
    StandingResponseDto getTopPerformers(int limit);
}