package com.hust.hustforces.model.dto.standings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRankDetailsDto {
    private int globalRank;
    private Integer countryRank;
    private double percentile;
    private String trend; // "up", "down", "stable"
    private int trendValue;
}