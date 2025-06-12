package com.hust.hustforces.model.dto.standings;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StandingFilter {
    private String timeRange; // "all", "year", "month", "week"
    private String category; // "overall", "problems", "contests"
}