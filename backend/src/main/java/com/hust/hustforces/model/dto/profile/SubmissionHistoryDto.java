package com.hust.hustforces.model.dto.profile;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubmissionHistoryDto {
    private String id;
    private String problemId;
    private String problemTitle;
    private String status;
    private String languageId;
    private String createdAt;
}
