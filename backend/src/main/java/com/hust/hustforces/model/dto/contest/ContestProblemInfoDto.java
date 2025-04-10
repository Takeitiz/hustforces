package com.hust.hustforces.model.dto.contest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestProblemInfoDto {
    private String id;
    private String problemId;
    private String title;
    private int index;
    private int solved;
}
