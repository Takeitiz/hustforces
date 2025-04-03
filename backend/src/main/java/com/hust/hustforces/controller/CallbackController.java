package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.Judge0Response;
import com.hust.hustforces.model.dto.SubmissionCallback;
import com.hust.hustforces.service.CallbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/callback")
@RequiredArgsConstructor
@Slf4j
public class CallbackController {
    private final CallbackService callbackService;

    @PutMapping("/{submissionId}")
    public ResponseEntity<String> handleCallback(@PathVariable("submissionId") String submissionId, @RequestBody SubmissionCallback callback) {
        log.info("Received callback for submission ID: {}", submissionId);

        try {
            callbackService.processCallback(submissionId, callback);
            return ResponseEntity.ok("Callback processed successfully");
        } catch (Exception e) {
            log.error("Error processing callback for submission {}: {}", submissionId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error processing callback: " + e.getMessage());
        }
    }
}
