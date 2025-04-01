package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.SubmissionResult;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.repository.SubmissionRepository;
import com.hust.hustforces.service.SubmissionProcessingService;
import com.hust.hustforces.service.SubmissionSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubmissionSchedulerServiceImpl implements SubmissionSchedulerService {
    private final SubmissionProcessingService submissionProcessingService;
    private final SubmissionRepository submissionRepository;

    @Scheduled(fixedDelay = 1000)
    @Override
    public void processSubmissions() {
        try {
            List<Submission> pendingSubmissions = submissionRepository
                    .findPendingSubmissions(
                            SubmissionResult.PENDING,
                            PageRequest.of(0, 20)
                    );

            for (Submission submission : pendingSubmissions) {
                System.out.println(submission);
                try {
                    submissionProcessingService.updateSubmission(submission);
                } catch (Exception e) {
                    log.error("Error processing submission {}: {}",
                            submission.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error during processing: ", e);
        }
    }
}
