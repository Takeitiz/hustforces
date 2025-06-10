package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.problem.*;
import com.hust.hustforces.model.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProblemMapper {

    @Mapping(target = "totalSubmissions", ignore = true)
    @Mapping(target = "acceptanceRate", ignore = true)
    ProblemDto toProblemDto(Problem problem);

    ProblemDetailDto toProblemDetailDto(Problem problem);

    // Mapping methods for nested entities
    DefaultCodeDto toDefaultCodeDto(DefaultCode defaultCode);
    List<DefaultCodeDto> toDefaultCodeDtoList(List<DefaultCode> defaultCodes);

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "contestId", source = "contestId")
    ContestSubmissionDto toContestSubmissionDto(ContestSubmission contestSubmission);
    List<ContestSubmissionDto> toContestSubmissionDtoList(List<ContestSubmission> contestSubmissions);

    @Mapping(target = "contestId", source = "contestId")
    ContestProblemDto toContestProblemDto(ContestProblem contestProblem);
    List<ContestProblemDto> toContestProblemDtoList(List<ContestProblem> contests);

    @Mapping(target = "userId", source = "userId")
    SubmissionDto toSubmissionDto(Submission submission);
    List<SubmissionDto> toSubmissionDtoList(List<Submission> submissions);

    default ProblemDto toProblemDtoWithStats(Problem problem, int totalSubmissions, int acceptedSubmissions) {
        ProblemDto dto = toProblemDto(problem);
        dto.setTotalSubmissions(totalSubmissions);
        if (totalSubmissions > 0) {
            dto.setAcceptanceRate((double) acceptedSubmissions / totalSubmissions * 100);
        } else {
            dto.setAcceptanceRate(0.0);
        }
        return dto;
    }
}