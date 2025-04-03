package com.hust.hustforces.model.dto.profile;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.model.dto.UserDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class UserProfileDto {
    private UserDto user;
    private UserStatsDto stats;
    private List<SubmissionHistoryDto> recentSubmissions;
    private List<RankingHistoryDto> rankingHistory;
    private Map<String, Integer> submissionCalendar;
    private Map<Difficulty, Integer> problemsSolvedByDifficulty;
}