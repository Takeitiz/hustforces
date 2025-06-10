package com.hust.hustforces.service;

import com.hust.hustforces.enums.Difficulty;
import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.ProblemDetails;
import com.hust.hustforces.model.dto.admin.TestcaseDto;
import com.hust.hustforces.model.dto.problem.ProblemDetailDto;
import com.hust.hustforces.model.dto.problem.ProblemDto;
import com.hust.hustforces.model.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.util.List;

public interface ProblemService {
    public ProblemDetails getProblem(String problemId, LanguageId languageId) throws IOException;
    public String getProblemFullBoilerplateCode(String problemId, LanguageId languageId) throws IOException;
    public List<String> getProblemInputs(String problemId) throws IOException;
    public List<String> getProblemOutputs(String problemId) throws IOException;
    public Problem getProblem(String problemId, String contestId);
    ProblemDetailDto getProblemDetailBySlug(String slug, String contestId);
    Page<ProblemDto> searchProblems(String search, Difficulty difficulty, Pageable pageable);
    Page<ProblemDto> getProblems(Pageable pageable);
    List<TestcaseDto> getProblemExampleTestcases(String slug, int limit);
}
