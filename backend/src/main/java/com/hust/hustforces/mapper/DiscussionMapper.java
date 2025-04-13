package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDetailDto;
import com.hust.hustforces.model.dto.discussion.DiscussionDto;
import com.hust.hustforces.model.entity.Discussion;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class, CommentMapper.class})
public interface DiscussionMapper {

    @Mapping(source = "discussion.id", target = "id")
    @Mapping(source = "discussion.title", target = "title")
    @Mapping(source = "discussion.content", target = "content")
    @Mapping(source = "user", target = "user")
    @Mapping(source = "discussion.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "discussion.createdAt", target = "createdAt")
    @Mapping(source = "discussion.updatedAt", target = "updatedAt")
    @Mapping(source = "commentCount", target = "commentCount")
    @Mapping(source = "discussion.viewCount", target = "viewCount")
    @Mapping(source = "discussion.upvotes", target = "upvotes")
    @Mapping(source = "discussion.downvotes", target = "downvotes")
    DiscussionDto toDiscussionDto(Discussion discussion, User user, Problem problem, int commentCount);

    @Mapping(source = "discussion.id", target = "id")
    @Mapping(source = "discussion.title", target = "title")
    @Mapping(source = "discussion.content", target = "content")
    @Mapping(source = "user", target = "user")
    @Mapping(source = "discussion.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "discussion.createdAt", target = "createdAt")
    @Mapping(source = "discussion.updatedAt", target = "updatedAt")
    @Mapping(source = "discussion.viewCount", target = "viewCount")
    @Mapping(source = "discussion.upvotes", target = "upvotes")
    @Mapping(source = "discussion.downvotes", target = "downvotes")
    @Mapping(source = "comments", target = "comments")
    DiscussionDetailDto toDiscussionDetailDto(Discussion discussion, User user, Problem problem, List<CommentDto> comments);

    @Named("problemTitleExtractor")
    default String extractProblemTitle(Problem problem) {
        return problem != null ? problem.getTitle() : null;
    }
}