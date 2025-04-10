package com.hust.hustforces.model.dto.contest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProblemSubmissionStatusDto {
    private String problemId;
    private int points;
    private int attempts;
    private String submissionId;
    private boolean solved;
}

