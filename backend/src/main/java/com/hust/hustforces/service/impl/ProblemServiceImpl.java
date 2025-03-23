package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.ProblemDetails;
import com.hust.hustforces.model.entity.Contest;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.ContestRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.service.ProblemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemServiceImpl implements ProblemService {
    @Value("${mount.path}")
    private String mountPath;
    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;

    @Override
    public ProblemDetails getProblem(String problemId, LanguageId languageId) throws IOException {
        log.info("Getting problem details for problemId: {}, languageId: {}", problemId, languageId);

        try {
            String fullBoilerplateCode = getProblemFullBoilerplateCode(problemId, languageId);
            log.debug("Retrieved boilerplate code for problem: {}, size: {} characters", problemId, fullBoilerplateCode.length());

            List<String> inputs = getProblemInputs(problemId);
            log.debug("Retrieved {} input files for problem: {}", inputs.size(), problemId);

            List<String> outputs = getProblemOutputs(problemId);
            log.debug("Retrieved {} output files for problem: {}", outputs.size(), problemId);

            ProblemDetails details = new ProblemDetails(
                    problemId,
                    fullBoilerplateCode,
                    inputs,
                    outputs
            );

            log.info("Successfully built problem details for problemId: {}", problemId);
            return details;
        } catch (IOException e) {
            log.error("Failed to get problem details for problemId: {}, languageId: {}", problemId, languageId, e);
            throw e;
        }
    }

    @Override
    public String getProblemFullBoilerplateCode(String problemId, LanguageId languageId) throws IOException {
        log.info("Getting full boilerplate code for problemId: {}, languageId: {}", problemId, languageId);

        Path path = Paths.get(mountPath, problemId, "boilerplate-full", "solution." + languageId);
        log.debug("Looking for boilerplate code at path: {}", path);

        try {
            String code = Files.readString(path);
            log.info("Successfully retrieved boilerplate code for problemId: {}, languageId: {}, size: {} bytes",
                    problemId, languageId, code.length());
            return code;
        } catch (IOException e) {
            log.error("Failed to read boilerplate code file for problemId: {}, languageId: {}, path: {}",
                    problemId, languageId, path, e);
            throw e;
        }
    }

    @Override
    public List<String> getProblemInputs(String problemId) throws IOException {
        log.info("Getting problem inputs for problemId: {}", problemId);

        Path inputsDir = Paths.get(mountPath, problemId, "tests", "inputs");
        log.debug("Looking for input files in directory: {}", inputsDir);

        try {
            List<String> inputs = Files.list(inputsDir)
                    .map(path -> {
                        try {
                            log.debug("Reading input file: {}", path.getFileName());
                            String content = Files.readString(path);
                            log.trace("Input file {} content size: {} bytes", path.getFileName(), content.length());
                            return content;
                        } catch (IOException e) {
                            log.error("Error reading input file: {}", path, e);
                            throw new RuntimeException("Error reading input file: " + path, e);
                        }
                    })
                    .collect(Collectors.toList());

            log.info("Successfully retrieved {} input files for problemId: {}", inputs.size(), problemId);
            return inputs;
        } catch (IOException e) {
            log.error("Failed to list input files for problemId: {}, directory: {}", problemId, inputsDir, e);
            throw e;
        }
    }

    @Override
    public List<String> getProblemOutputs(String problemId) throws IOException {
        log.info("Getting problem outputs for problemId: {}", problemId);

        Path outputsDir = Paths.get(mountPath, problemId, "tests", "outputs");
        log.debug("Looking for output files in directory: {}", outputsDir);

        try {
            List<String> outputs = Files.list(outputsDir)
                    .map(path -> {
                        try {
                            log.debug("Reading output file: {}", path.getFileName());
                            String content = Files.readString(path);
                            log.trace("Output file {} content size: {} bytes", path.getFileName(), content.length());
                            return content;
                        } catch (IOException e) {
                            log.error("Error reading output file: {}", path, e);
                            throw new RuntimeException("Error reading output file: " + path, e);
                        }
                    })
                    .collect(Collectors.toList());

            log.info("Successfully retrieved {} output files for problemId: {}", outputs.size(), problemId);
            return outputs;
        } catch (IOException e) {
            log.error("Failed to list output files for problemId: {}, directory: {}", problemId, outputsDir, e);
            throw e;
        }
    }

    @Override
    public Problem getProblem(String problemId, String contestId) {
        log.info("Getting problem metadata for problemId: {}, contestId: {}", problemId, contestId);

        if (contestId != null && !contestId.isEmpty()) {
            log.debug("Looking up contest with id: {}", contestId);
            Optional<Contest> contestOpt = contestRepository.findByIdAndHiddenFalse(contestId);

            if (contestOpt.isEmpty()) {
                log.warn("Contest not found or hidden: contestId: {}", contestId);
                return null;
            }

            log.debug("Contest found: {}, looking up problem in contest context", contestId);
            Optional<Problem> problemOpt = problemRepository.findByIdWithDefaultCodeAndInContest(problemId, contestId);

            if (problemOpt.isEmpty()) {
                log.warn("Problem not found in contest: problemId: {}, contestId: {}", problemId, contestId);
            } else {
                log.info("Problem found in contest: problemId: {}, contestId: {}", problemId, contestId);
            }

            return problemOpt.orElse(null);
        }

        log.debug("No contest specified, looking up problem directly: {}", problemId);
        Optional<Problem> problemOpt = problemRepository.findByIdWithDefaultCode(problemId);

        if (problemOpt.isEmpty()) {
            log.warn("Problem not found: problemId: {}", problemId);
        } else {
            log.info("Problem found: problemId: {}", problemId);
        }

        return problemOpt.orElse(null);
    }

    @Override
    public List<Problem> getProblems() {
        log.info("Getting all visible problems with default code");

        List<Problem> problems = problemRepository.getAllNotHiddenProblemsWithDefaultCode();
        log.info("Retrieved {} visible problems", problems.size());

        return problems;
    }
}
