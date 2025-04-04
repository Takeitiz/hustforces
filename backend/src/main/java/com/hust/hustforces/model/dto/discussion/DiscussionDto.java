package com.hust.hustforces.model.dto.discussion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionDto {
    private String id;
    private String title;
    private String content;
    private UserSummaryDto user;
    private String problemId;
    private String problemTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int commentCount;
    private int viewCount;
    private int upvotes;
    private int downvotes;
}
