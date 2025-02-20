package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.dto.LanguageId;
import com.hust.hustforces.model.dto.ProblemDto;
import com.hust.hustforces.service.ProblemService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProblemServiceImpl implements ProblemService {
    @Value("${mount.path}")
    private String mountPath;

    @Override
    public ProblemDto getProblem(String problemId, LanguageId languageId) throws IOException {
        String fullBoilerplateCode = getProblemFullBoilerplateCode(problemId, languageId);
        List<String> inputs = getProblemInputs(problemId);
        List<String> outputs = getProblemOutputs(problemId);

        return new ProblemDto(
                problemId,
                fullBoilerplateCode,
                inputs,
                outputs
        );
    }

    @Override
    public String getProblemFullBoilerplateCode(String problemId, LanguageId languageId) throws IOException {
        Path path = Paths.get(mountPath, problemId, "boilerplate-full", "solution." + languageId);
        return Files.readString(path);
    }

    @Override
    public List<String> getProblemInputs(String problemId) throws IOException {
        Path inputsDir = Paths.get(mountPath, problemId, "tests", "inputs");
        return Files.list(inputsDir)
                .map(path -> {
                    try {
                        return Files.readString(path);
                    } catch (IOException e) {
                        throw new RuntimeException("Error reading input file: " + path, e);
                    }
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getProblemOutputs(String problemId) throws IOException {
        Path outputsDir = Paths.get(mountPath, problemId, "tests", "outputs");
        return Files.list(outputsDir)
                .map(path -> {
                    try {
                        return Files.readString(path);
                    } catch (IOException e) {
                        throw new RuntimeException("Error reading output file: " + path, e);
                    }
                })
                .collect(Collectors.toList());
    }
}
