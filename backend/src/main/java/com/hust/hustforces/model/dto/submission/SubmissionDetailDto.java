package com.hust.hustforces.model.dto.submission;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.enums.SubmissionResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDetailDto {
    private String id;
    private String problemId;
    private String problemTitle;
    private String userId;
    private String username;
    private String code;
    private SubmissionResult status;
    private LanguageId languageId;
    private double time;
    private int memory;
    private LocalDateTime createdAt;
    private List<TestCaseDto> testcases;
    private String activeContestId;
}
