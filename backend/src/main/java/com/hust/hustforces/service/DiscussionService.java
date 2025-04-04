package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.discussion.DiscussionDetailDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DiscussionService {
    DiscussionDto createDiscussion(String title, String content, String userId, String problemId);

    DiscussionDetailDto getDiscussion(String id, String userId);

    DiscussionDto updateDiscussion(String id, String title, String content, String userId);

    void deleteDiscussion(String id, String userId);

    Page<DiscussionDto> getAllDiscussions(Pageable pageable);

    Page<DiscussionDto> getDiscussionsByProblem(String problemId, Pageable pageable);

    Page<DiscussionDto> getDiscussionsByUser(String userId, Pageable pageable);

    Page<DiscussionDto> searchDiscussions(String query, Pageable pageable);

    DiscussionDto voteDiscussion(String id, String userId, boolean isUpvote);
}
