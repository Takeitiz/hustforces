package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.Judge0Submission;
import com.hust.hustforces.model.dto.ResponseDto;
import com.hust.hustforces.model.dto.SubmissionInput;
import com.hust.hustforces.model.entity.Submission;
import com.hust.hustforces.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;

    @PostMapping("")
    public ResponseEntity<?> post(@Valid @RequestBody SubmissionInput input) throws IOException {
        Submission submission = submissionService.createSubmission(input, "1");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submission);
    }

    @GetMapping
    public ResponseEntity<?> get(@RequestParam("id") String submissionId) throws BadRequestException {
        Submission submission = submissionService.getSubmission(submissionId);
        return ResponseEntity.ok(submission);
    }
}
