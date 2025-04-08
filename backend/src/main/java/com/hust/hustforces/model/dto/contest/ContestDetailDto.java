package com.hust.hustforces.model.dto.contest;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class ContestDetailDto {
    private String id;
    private String name;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String rules;
    private List<ContestProblemDto> problems;
}
