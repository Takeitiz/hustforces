package com.hust.hustforces.service.impl;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.dto.ProblemDto;
import com.hust.hustforces.model.dto.SubmissionInput;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.service.ProblemService;
import com.hust.hustforces.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl implements SubmissionService {
    private final ProblemRepository problemRepository;
    private final ProblemService problemService;

    @Override
    public String createSubmission(SubmissionInput input, String userId) throws IOException {
//        Problem problem = problemRepository.findById(input.getProblemId()).orElseThrow(
//                () -> new ResourceNotFoundException("Problem", "id", input.getProblemId())
//        );
//        ProblemDto problemDto = problemService.getProblem(problem.getSlug(), input.getLanguageId());
        ProblemDto problemDto = problemService.getProblem("max-element", input.getLanguageId());
        return problemDto.getFullBoilerplateCode().replace("##USER_CODE_HERE##", input.getCode());
    }


}
