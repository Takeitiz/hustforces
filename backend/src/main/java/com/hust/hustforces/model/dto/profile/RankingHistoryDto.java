package com.hust.hustforces.model.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RankingHistoryDto {
    private String date;
    private int rank;
    private int rating;
    private String contestId;
    private String contestName;
}
