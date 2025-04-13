package com.hust.hustforces.mapper;

import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.dto.submission.SubmissionResponseDto;
import com.hust.hustforces.model.dto.submission.TestCaseDto;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.model.entity.TestCase;
import com.hust.hustforces.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.util.List;

@Mapper(componentModel = "spring")
public interface SubmissionMapper {

    @Mapping(source = "submission.id", target = "id")
    @Mapping(source = "submission.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "submission.userId", target = "userId")
    @Mapping(source = "user.username", target = "username")
    @Mapping(source = "submission.code", target = "code")
    @Mapping(source = "submission.status", target = "status")
    @Mapping(source = "submission.languageId", target = "languageId")
    @Mapping(source = "submission.time", target = "time")
    @Mapping(source = "submission.memory", target = "memory")
    @Mapping(source = "submission.createdAt", target = "createdAt")
    @Mapping(source = "testcases", target = "testcases")
    @Mapping(source = "submission.activeContestId", target = "activeContestId")
    SubmissionDetailDto toSubmissionDetailDto(Submission submission, Problem problem, User user, List<TestCaseDto> testcases);

    @Mapping(source = "submission.id", target = "id")
    @Mapping(source = "submission.problemId", target = "problemId")
    @Mapping(source = "problem.title", target = "problemTitle")
    @Mapping(source = "submission.status", target = "status")
    @Mapping(source = "submission.languageId", target = "languageId")
    @Mapping(source = "submission.time", target = "time")
    @Mapping(source = "submission.memory", target = "memory")
    @Mapping(source = "submission.createdAt", target = "createdAt")
    @Mapping(source = "passedTestCases", target = "passedTestCases")
    @Mapping(source = "totalTestCases", target = "totalTestCases")
    SubmissionResponseDto toSubmissionResponseDto(Submission submission, Problem problem, int passedTestCases, int totalTestCases);

    @Mapping(source = "testCase.id", target = "id")
    @Mapping(source = "testCase.status_id", target = "status_id")
    @Mapping(source = "testCase.stdin", target = "stdin")
    @Mapping(source = "testCase.stdout", target = "stdout")
    @Mapping(source = "testCase.expected_output", target = "expected_output")
    @Mapping(source = "testCase.stderr", target = "stderr")
    @Mapping(source = "testCase.time", target = "time", qualifiedByName = "bigDecimalToDouble")
    @Mapping(source = "testCase.memory", target = "memory")
    TestCaseDto toTestCaseDto(TestCase testCase);

    @Named("bigDecimalToDouble")
    default Double bigDecimalToDouble(BigDecimal value) {
        return value != null ? value.doubleValue() : null;
    }
}
