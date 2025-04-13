package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.discussion.CommentDto;
import com.hust.hustforces.model.dto.discussion.SolutionDetailDto;
import com.hust.hustforces.model.dto.discussion.SolutionDto;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.Solution;
import com.hust.hustforces.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {UserMapper.class, CommentMapper.class})
public interface SolutionMapper {

    @Mapping(source = "solution.id", target = "id")
    @Mapping(source = "solution.description", target = "description")
    @Mapping(source = "user", target = "user")
    @Mapping(source = "solution.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "solution.languageId", target = "languageId")
    @Mapping(source = "solution.createdAt", target = "createdAt")
    @Mapping(source = "solution.updatedAt", target = "updatedAt")
    @Mapping(source = "commentCount", target = "commentCount")
    @Mapping(source = "solution.upvotes", target = "upvotes")
    @Mapping(source = "solution.downvotes", target = "downvotes")
    SolutionDto toSolutionDto(Solution solution, User user, Problem problem, int commentCount);

    @Mapping(source = "solution.id", target = "id")
    @Mapping(source = "solution.code", target = "code")
    @Mapping(source = "solution.description", target = "description")
    @Mapping(source = "user", target = "user")
    @Mapping(source = "solution.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "solution.languageId", target = "languageId")
    @Mapping(source = "solution.createdAt", target = "createdAt")
    @Mapping(source = "solution.updatedAt", target = "updatedAt")
    @Mapping(source = "solution.upvotes", target = "upvotes")
    @Mapping(source = "solution.downvotes", target = "downvotes")
    @Mapping(source = "comments", target = "comments")
    SolutionDetailDto toSolutionDetailDto(Solution solution, User user, Problem problem, List<CommentDto> comments);
}
