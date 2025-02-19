package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.SubmissionInput;
import com.hust.hustforces.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;

    @PostMapping("")
    public ResponseEntity<?> post(@Valid @RequestBody SubmissionInput input) throws IOException {
        String code = submissionService.createSubmission(input, "1");
        return ResponseEntity.ok(code);
    }
}
