package com.hust.hustforces.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@Getter
@RequiredArgsConstructor
public class ContestCompletedEvent {
    private final String contestId;
    private final String contestName;
    private final Map<String, RankData> rankings;

    @Data
    @AllArgsConstructor
    public static class RankData {
        private int rank;
        private int oldRating;
        private int newRating;
        private int ratingChange;
    }
}
