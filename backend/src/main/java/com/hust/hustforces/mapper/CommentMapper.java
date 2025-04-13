package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.entity.Comment;
import com.hust.hustforces.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class})
public interface CommentMapper {

    @Mapping(source = "comment.id", target = "id")
    @Mapping(source = "comment.content", target = "content")
    @Mapping(source = "user", target = "user")
    @Mapping(source = "comment.parentId", target = "parentId")
    @Mapping(source = "comment.createdAt", target = "createdAt")
    @Mapping(source = "comment.updatedAt", target = "updatedAt")
    @Mapping(source = "comment.upvotes", target = "upvotes")
    @Mapping(source = "comment.downvotes", target = "downvotes")
    @Mapping(source = "replies", target = "replies")
    CommentDto toCommentDto(Comment comment, User user, List<CommentDto> replies);
}
