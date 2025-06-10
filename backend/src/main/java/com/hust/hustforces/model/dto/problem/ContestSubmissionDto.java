package com.hust.hustforces.model.dto.problem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestSubmissionDto {
    private String id;
    private String userId;
    private String contestId;
    private int points;
}
