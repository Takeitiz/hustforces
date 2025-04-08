package com.hust.hustforces.model.dto.contest;

import lombok.Data;

@Data
public class ScoreboardEntryDto {
    private int rank;
    private String userId;
    private String username;
    private int score;
    private long penalty;
}