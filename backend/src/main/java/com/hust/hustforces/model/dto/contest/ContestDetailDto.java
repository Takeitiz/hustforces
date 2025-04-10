package com.hust.hustforces.model.dto.contest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestDetailDto {
    private String id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean hidden;
    private boolean leaderboard;
    private LocalDateTime createdAt;
    private ContestStatus status;
    private List<ContestProblemInfoDto> problems;
    private List<ContestLeaderboardEntryDto> leaderboard;
}
