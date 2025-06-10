package com.hust.hustforces.model.dto.problem;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestProblemDto {
    private String id;
    private String contestId;
    private int index;
    private int solved;
}
