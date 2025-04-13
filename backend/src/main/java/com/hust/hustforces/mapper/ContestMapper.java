package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.contest.*;
import com.hust.hustforces.model.entity.Contest;
import com.hust.hustforces.model.entity.ContestProblem;
import com.hust.hustforces.model.entity.Problem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ContestMapper {

    @Mapping(source = "contest.id", target = "id")
    @Mapping(source = "contest.title", target = "title")
    @Mapping(source = "contest.description", target = "description")
    @Mapping(source = "contest.startTime", target = "startTime")
    @Mapping(source = "contest.endTime", target = "endTime")
    @Mapping(source = "contest.hidden", target = "hidden")
    @Mapping(source = "contest.leaderboard", target = "leaderboard")
    @Mapping(source = "contest.createdAt", target = "createdAt")
    @Mapping(source = "problems", target = "problems")
    @Mapping(source = "contest", target = "status", qualifiedByName = "determineContestStatus")
    ContestDto toContestDto(Contest contest, List<ContestProblemInfoDto> problems);

    @Mapping(source = "contest.id", target = "id")
    @Mapping(source = "contest.title", target = "title")
    @Mapping(source = "contest.description", target = "description")
    @Mapping(source = "contest.startTime", target = "startTime")
    @Mapping(source = "contest.endTime", target = "endTime")
    @Mapping(source = "contest.hidden", target = "hidden")
    @Mapping(source = "contest.createdAt", target = "createdAt")
    @Mapping(source = "problems", target = "problems")
    @Mapping(source = "contest", target = "status", qualifiedByName = "determineContestStatus")
    @Mapping(source = "leaderboard", target = "leaderboard")
    ContestDetailDto toContestDetailDto(Contest contest, List<ContestProblemInfoDto> problems, List<ContestLeaderboardEntryDto> leaderboard);

    @Mapping(source = "contestProblem.id", target = "id")
    @Mapping(source = "problem.id", target = "problemId")
    @Mapping(source = "problem.title", target = "title")
    @Mapping(source = "contestProblem.index", target = "index")
    @Mapping(source = "contestProblem.solved", target = "solved")
    ContestProblemInfoDto toContestProblemInfoDto(ContestProblem contestProblem, Problem problem);

    @Named("determineContestStatus")
    default ContestStatus determineContestStatus(Contest contest) {
        LocalDateTime now = LocalDateTime.now();

        if (contest.getEndTime().isBefore(now)) {
            return ContestStatus.ENDED;
        } else if (contest.getStartTime().isBefore(now)) {
            return ContestStatus.ACTIVE;
        } else {
            return ContestStatus.UPCOMING;
        }
    }
}
