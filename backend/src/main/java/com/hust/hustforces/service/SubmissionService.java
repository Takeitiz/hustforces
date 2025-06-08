package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.SubmissionRequest;
import com.hust.hustforces.model.dto.profile.SubmissionHistoryDto;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.dto.submission.SubmissionResponseDto;
import com.hust.hustforces.model.entity.Submission;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.util.List;

public interface SubmissionService {
    SubmissionDetailDto createSubmission(SubmissionRequest input, String userId) throws IOException;
    SubmissionDetailDto getSubmission(String submissionId) throws BadRequestException;
    List<SubmissionResponseDto> getUserSubmissionsForProblem(String userId, String problemId);
    Page<SubmissionHistoryDto> getUserSubmissions(String username, Pageable pageable);
}
