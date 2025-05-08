package com.hust.hustforces.model.dto.contest;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaderboardPageDto {
    private List<ContestLeaderboardEntryDto> entries;
    private int page;
    private int size;
    private int totalItems;
}
