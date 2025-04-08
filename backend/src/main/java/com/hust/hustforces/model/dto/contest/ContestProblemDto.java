package com.hust.hustforces.model.dto.contest;

import lombok.Data;

@Data
public class ContestProblemDto {
    private String problemId;
    private String problemName;
    private String problemCode;
    private Integer points;
}
