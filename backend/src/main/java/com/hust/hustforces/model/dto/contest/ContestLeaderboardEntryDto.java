package com.hust.hustforces.model.dto.contest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestLeaderboardEntryDto {
    private String userId;
    private String username;
    private int rank;
    private int totalPoints;
    private List<ProblemSubmissionStatusDto> problemStatuses;
}
