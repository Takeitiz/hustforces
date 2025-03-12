package com.hust.hustforces.service;

import com.hust.hustforces.model.entity.Submission;

public interface SubmissionProcessingService {
    public void processSubmissions();
    public void updateSubmission(Submission submission);
    public void updateContest(Submission submission);
}
