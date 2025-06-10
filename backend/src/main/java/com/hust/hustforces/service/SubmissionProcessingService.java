package com.hust.hustforces.service;

import com.hust.hustforces.model.entity.ContestSubmission;
import com.hust.hustforces.model.entity.Submission;

public interface SubmissionProcessingService {
    public void updateSubmission(Submission submission);
    ContestSubmission updateContest(Submission submission);
}
