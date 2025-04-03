package com.hust.hustforces.service;

import com.hust.hustforces.model.dto.SubmissionCallback;

public interface CallbackService {
    /**
     * Process a callback from Judge0 for a specific submission
     *
     * @param submissionId The ID of the submission
     * @param callback The callback data from Judge0
     */
    void processCallback(String submissionId, SubmissionCallback callback);
}
