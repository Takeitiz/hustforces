package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.SubmissionInput;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/submission")
public class SubmissionController {

    @PostMapping("")
    public ResponseEntity<?> post(@Valid SubmissionInput input) {

    }
}
