package com.hust.hustforces.model.dto.contest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class CreateContestRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private OffsetDateTime startTime;
    @NotNull
    private OffsetDateTime endTime;
    private String rules;
    private List<String> problemIds;
}
