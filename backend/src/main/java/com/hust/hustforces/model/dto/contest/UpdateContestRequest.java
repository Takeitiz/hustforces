package com.hust.hustforces.model.dto.contest;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class UpdateContestRequest {
    private String name;
    private String description;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private String rules;
    private List<String> problemIds;
}
