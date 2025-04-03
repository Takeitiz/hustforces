package com.hust.hustforces.model.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserStatsDto {
    private int totalSubmissions;
    private int acceptedSubmissions;
    private int problemsSolved;
    private int contests;
    private int currentRank;
    private int maxRank;
}
