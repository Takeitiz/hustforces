package com.hust.hustforces.controller;

import com.hust.hustforces.service.ImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ImportController {
    private final ImportService importService;

    @GetMapping("/{problemSlug}")
    public ResponseEntity<?> addProblem(@PathVariable String problemSlug) throws IOException {
        importService.processProblem(problemSlug);
        return ResponseEntity.status(HttpStatus.OK)
                .body("success");
    }

    @GetMapping("/")
    public ResponseEntity<?> processAllProblem() throws IOException {
        importService.addProblemsInDB();
        return ResponseEntity.status(HttpStatus.OK)
                .body("success");
    }

    @GetMapping("/languages")
    public ResponseEntity<?> processLanguages() throws IOException {
        importService.seedLanguagesFromMapping();
        return ResponseEntity.status(HttpStatus.OK)
                .body("success");
    }
}
