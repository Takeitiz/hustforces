package com.hust.hustforces.model.dto.problem;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.enums.SubmissionResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDto {
    private String id;
    private String userId;
    private SubmissionResult status;
    private LanguageId languageId;
    private double time;
    private int memory;
    private LocalDateTime createdAt;
}