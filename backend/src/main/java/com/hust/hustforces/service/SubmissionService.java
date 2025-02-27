package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.Judge0Submission;
import com.hust.hustforces.model.dto.SubmissionInput;
import com.hust.hustforces.model.entity.Submission;
import org.apache.coyote.BadRequestException;

import java.io.IOException;
import java.util.List;

public interface SubmissionService {
    public Submission createSubmission(SubmissionInput input, String userId) throws IOException;
    public Submission getSubmission(String submissionId) throws BadRequestException;
}
