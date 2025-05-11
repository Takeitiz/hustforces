package com.hust.hustforces.model.dto.discussion;

import com.hust.hustforces.model.dto.common.PaginationInfo;
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
public class DiscussionDetailDto {
    private String id;
    private String title;
    private String content;
    private UserSummaryDto user;
    private String problemId;
    private String problemTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int viewCount;
    private int upvotes;
    private int downvotes;
    private List<CommentDto> comments;
    private PaginationInfo commentPagination;
}