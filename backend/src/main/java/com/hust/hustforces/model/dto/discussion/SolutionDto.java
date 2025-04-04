package com.hust.hustforces.model.dto.discussion;

import com.hust.hustforces.enums.LanguageId;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolutionDto {
    private String id;
    private String description;
    private UserSummaryDto user;
    private String problemId;
    private String problemTitle;
    private LanguageId languageId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int commentCount;
    private int upvotes;
    private int downvotes;
}
