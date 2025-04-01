package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.SubmissionRequest;
import com.hust.hustforces.model.entity.Submission;
import org.apache.coyote.BadRequestException;

import java.io.IOException;
import java.util.List;

public interface SubmissionService {
    public Submission createSubmission(SubmissionRequest input, String userId) throws IOException;
    public Submission getSubmission(String submissionId) throws BadRequestException;
    List<Submission> getUserSubmissionsForProblem(String userId, String problemId);
}
