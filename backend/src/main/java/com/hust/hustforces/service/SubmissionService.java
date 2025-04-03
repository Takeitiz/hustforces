package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.SubmissionRequest;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.dto.submission.SubmissionResponseDto;
import com.hust.hustforces.model.entity.Submission;
import org.apache.coyote.BadRequestException;

import java.io.IOException;
import java.util.List;

public interface SubmissionService {
    SubmissionDetailDto createSubmission(SubmissionRequest input, String userId) throws IOException;
    SubmissionDetailDto getSubmission(String submissionId) throws BadRequestException;
    List<SubmissionResponseDto> getUserSubmissionsForProblem(String userId, String problemId);
}
