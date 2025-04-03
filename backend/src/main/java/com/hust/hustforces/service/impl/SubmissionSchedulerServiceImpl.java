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

import java.time.LocalDateTime;
import java.util.List;

//@Service
//@Slf4j
//@RequiredArgsConstructor
//public class SubmissionSchedulerServiceImpl implements SubmissionSchedulerService {
//    private final SubmissionProcessingService submissionProcessingService;
//    private final SubmissionRepository submissionRepository;
//
//
//    /**
//     * Process submissions that are still in PENDING state
//     * This serves as a fallback mechanism for submissions that weren't properly
//     * processed via callbacks or for old submissions that don't use the callback approach
//     */
//    @Scheduled(fixedDelay = 30000)
//    @Override
//    public void processSubmissions() {
//        try {
//            LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(5);
//
//            List<Submission> pendingSubmissions = submissionRepository
//                    .findPendingSubmissions(
//                            SubmissionResult.PENDING,
//                            PageRequest.of(0, 20)
//                    );
//
//            int pendingCount = pendingSubmissions.size();
//            if (pendingCount > 0) {
//                log.info("Found {} pending submissions to process as fallback", pendingCount);
//            }
//
//            for (Submission submission : pendingSubmissions) {
//                // Only process submissions that have been pending for a while
//                if (submission.getCreatedAt().isBefore(cutoffTime)) {
//                    try {
//                        log.info("Processing stale pending submission: {}", submission.getId());
//                        submissionProcessingService.updateSubmission(submission);
//                    } catch (Exception e) {
//                        log.error("Error processing submission {}: {}",
//                                submission.getId(), e.getMessage());
//                    }
//                }
//            }
//        } catch (Exception e) {
//            log.error("Error during fallback submission processing: ", e);
//        }
//    }
//}
