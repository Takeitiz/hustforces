package com.hust.hustforces.model.dto.contest;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ContestSummaryDto {
    private String id;
    private String name;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
}
