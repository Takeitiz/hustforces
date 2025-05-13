package com.hust.hustforces.event;

import com.hust.hustforces.enums.SubmissionResult;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class SubmissionCompletedEvent {
    private final String submissionId;
    private final String userId;
    private final SubmissionResult status;
}
