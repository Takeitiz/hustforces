package com.hust.hustforces.service;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.ProblemDetails;
import com.hust.hustforces.model.entity.Problem;

import java.io.IOException;
import java.util.List;

public interface ProblemService {
    public ProblemDetails getProblem(String problemId, LanguageId languageId) throws IOException;
    public String getProblemFullBoilerplateCode(String problemId, LanguageId languageId) throws IOException;
    public List<String> getProblemInputs(String problemId) throws IOException;
    public List<String> getProblemOutputs(String problemId) throws IOException;
    public Problem getProblem(String problemId, String contestId);
    public List<Problem> getProblems();
}
