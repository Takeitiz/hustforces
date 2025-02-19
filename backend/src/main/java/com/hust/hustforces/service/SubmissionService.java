package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.SubmissionInput;

import java.io.IOException;

public interface SubmissionService {
    public String createSubmission(SubmissionInput input, String userId) throws IOException;
}
