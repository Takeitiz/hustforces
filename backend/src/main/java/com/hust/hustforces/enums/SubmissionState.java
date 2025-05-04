package com.hust.hustforces.enums;

public enum SubmissionState {
    CREATED, // Initial state
    SUBMITTED, // Sent to Judge0
    PROCESSING, // Receiving results
    COMPLETED, // All test cases processed
    FAILED // Error state
}
