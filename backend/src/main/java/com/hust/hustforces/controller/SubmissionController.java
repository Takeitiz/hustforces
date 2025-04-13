package com.hust.hustforces.controller;

import com.hust.hustforces.model.dto.ResponseDto;
import com.hust.hustforces.model.dto.SubmissionRequest;
import com.hust.hustforces.model.dto.submission.SubmissionDetailDto;
import com.hust.hustforces.model.dto.submission.SubmissionResponseDto;
import com.hust.hustforces.service.SubmissionService;
import com.hust.hustforces.utils.CurrentUserUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;
    private final CurrentUserUtil currentUserUtil;

    @PostMapping("")
    public ResponseEntity<SubmissionDetailDto> post(@Valid @RequestBody SubmissionRequest input) throws IOException {
        String userId = currentUserUtil.getCurrentUserId();
        SubmissionDetailDto submission = submissionService.createSubmission(input, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submission);
    }


    @GetMapping("")
    public ResponseEntity<?> getSubmissions(@RequestParam(required = false) String problemId) {
        if (problemId != null && !problemId.isEmpty()) {
            String userId = currentUserUtil.getCurrentUserId();
            List<SubmissionResponseDto> submissions = submissionService.getUserSubmissionsForProblem(userId, problemId);

            Map<String, Object> response = new HashMap<>();
            response.put("submissions", submissions);
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(new ResponseDto("400", "Problem ID is required"));
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<SubmissionDetailDto> get(@PathVariable("submissionId") String submissionId) throws BadRequestException {
        SubmissionDetailDto submission = submissionService.getSubmission(submissionId);
        return ResponseEntity.ok(submission);
    }
}
