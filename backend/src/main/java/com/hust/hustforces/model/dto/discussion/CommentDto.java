package com.hust.hustforces.model.dto.discussion;

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
public class CommentDto {
    private String id;
    private String content;
    private UserSummaryDto user;
    private String parentId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int upvotes;
    private int downvotes;
    private List<CommentDto> replies;
}
