package com.hust.hustforces.service.impl;

import com.hust.hustforces.enums.LanguageId;
import com.hust.hustforces.model.dto.ProblemDetails;
import com.hust.hustforces.model.entity.Contest;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.ContestRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.service.ProblemService;
import com.hust.hustforces.utils.ProblemFileUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemServiceImpl implements ProblemService {

    private final ProblemFileUtil fileUtil;
    private final ProblemCacheService cacheService;
    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;

    // In-memory cache for problem metadata to avoid repeated DB lookups
    private final Map<String, Problem> problemMetadataCache = new ConcurrentHashMap<>();

    // Timeout values for async operations
    private static final long ASYNC_TIMEOUT_SECONDS = 5;

    @Override
    public ProblemDetails getProblem(String problemId, LanguageId languageId) throws IOException {
        log.info("Getting problem details for problemId: {}, languageId: {}", problemId, languageId);

        // First check Redis cache
        Optional<ProblemDetails> cachedDetails = cacheService.getCachedProblemDetails(problemId, languageId);
        if (cachedDetails.isPresent()) {
            log.debug("Cache hit: Found problem details in cache for problemId: {}, languageId: {}",
                    problemId, languageId);
            return cachedDetails.get();
        }

        // Get the problem slug from database
        Problem problem = getProblemMetadata(problemId);
        String problemSlug = problem.getSlug();

        // Validate problem directory exists
        if (!fileUtil.problemDirectoryExists(problemSlug)) {
            log.error("Problem directory not found for slug: {}", problemSlug);
            throw new IOException("Problem files not found");
        }

        try {
            // Execute async file operations in parallel
            CompletableFuture<String> codeFuture =
                    fileUtil.readFullBoilerplateCodeAsync(problemSlug, languageId);

            CompletableFuture<List<String>> inputsFuture =
                    fileUtil.readTestInputsAsync(problemSlug);

            CompletableFuture<List<String>> outputsFuture =
                    fileUtil.readTestOutputsAsync(problemSlug);

            // Wait for all futures to complete
            CompletableFuture<Void> allFutures =
                    CompletableFuture.allOf(codeFuture, inputsFuture, outputsFuture);

            // Get results with timeout
            allFutures.get(ASYNC_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            String fullBoilerplateCode = codeFuture.get();
            List<String> inputs = inputsFuture.get();
            List<String> outputs = outputsFuture.get();

            // Create problem details
            ProblemDetails details = new ProblemDetails(
                    problemId,
                    fullBoilerplateCode,
                    inputs,
                    outputs
            );

            // Cache the results
            cacheService.cacheProblemDetails(problemId, languageId, details);
            cacheService.cacheProblemCode(problemId, languageId, fullBoilerplateCode);
            cacheService.cacheProblemInputs(problemId, inputs);
            cacheService.cacheProblemOutputs(problemId, outputs);

            log.info("Successfully built and cached problem details for problemId: {}", problemId);
            return details;

        } catch (InterruptedException | ExecutionException e) {
            log.error("Error loading problem files asynchronously for problemId: {}", problemId, e);
            Thread.currentThread().interrupt();
            throw new IOException("Failed to load problem files: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error loading problem details for problemId: {}", problemId, e);
            throw new IOException("Failed to load problem details: " + e.getMessage());
        }
    }

    @Override
    public String getProblemFullBoilerplateCode(String problemId, LanguageId languageId) throws IOException {
        log.info("Getting full boilerplate code for problemId: {}, languageId: {}", problemId, languageId);

        // Check cache first
        Optional<String> cachedCode = cacheService.getCachedProblemCode(problemId, languageId);
        if (cachedCode.isPresent()) {
            log.debug("Cache hit: Found boilerplate code in cache for problemId: {}, languageId: {}",
                    problemId, languageId);
            return cachedCode.get();
        }

        // Get the problem slug
        Problem problem = getProblemMetadata(problemId);
        String problemSlug = problem.getSlug();

        try {
            // Get code asynchronously
            String code = fileUtil.readFullBoilerplateCodeAsync(problemSlug, languageId)
                    .get(ASYNC_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Cache the result
            cacheService.cacheProblemCode(problemId, languageId, code);

            return code;
        } catch (Exception e) {
            log.error("Error getting problem boilerplate code for problemId: {}, languageId: {}",
                    problemId, languageId, e);
            throw new IOException("Failed to get boilerplate code: " + e.getMessage());
        }
    }

    @Override
    public List<String> getProblemInputs(String problemId) throws IOException {
        log.info("Getting problem inputs for problemId: {}", problemId);

        // Check cache first
        Optional<List<String>> cachedInputs = cacheService.getCachedProblemInputs(problemId);
        if (cachedInputs.isPresent()) {
            log.debug("Cache hit: Found problem inputs in cache for problemId: {}", problemId);
            return cachedInputs.get();
        }

        // Get the problem slug
        Problem problem = getProblemMetadata(problemId);
        String problemSlug = problem.getSlug();

        try {
            // Get inputs asynchronously
            List<String> inputs = fileUtil.readTestInputsAsync(problemSlug)
                    .get(ASYNC_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Cache the result
            cacheService.cacheProblemInputs(problemId, inputs);

            return inputs;
        } catch (Exception e) {
            log.error("Error getting problem inputs for problemId: {}", problemId, e);
            throw new IOException("Failed to get problem inputs: " + e.getMessage());
        }
    }

    @Override
    public List<String> getProblemOutputs(String problemId) throws IOException {
        log.info("Getting problem outputs for problemId: {}", problemId);

        // Check cache first
        Optional<List<String>> cachedOutputs = cacheService.getCachedProblemOutputs(problemId);
        if (cachedOutputs.isPresent()) {
            log.debug("Cache hit: Found problem outputs in cache for problemId: {}", problemId);
            return cachedOutputs.get();
        }

        // Get the problem slug
        Problem problem = getProblemMetadata(problemId);
        String problemSlug = problem.getSlug();

        try {
            // Get outputs asynchronously
            List<String> outputs = fileUtil.readTestOutputsAsync(problemSlug)
                    .get(ASYNC_TIMEOUT_SECONDS, TimeUnit.SECONDS);

            // Cache the result
            cacheService.cacheProblemOutputs(problemId, outputs);

            return outputs;
        } catch (Exception e) {
            log.error("Error getting problem outputs for problemId: {}", problemId, e);
            throw new IOException("Failed to get problem outputs: " + e.getMessage());
        }
    }

    @Override
    @Cacheable(value = "problems", key = "#problemId + '_' + #contestId")
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
                problemOpt.ifPresent(p -> problemMetadataCache.put(problemId, p));
            }

            return problemOpt.orElse(null);
        }

        log.debug("No contest specified, looking up problem directly: {}", problemId);
        Optional<Problem> problemOpt = problemRepository.findByIdWithDefaultCode(problemId);

        if (problemOpt.isEmpty()) {
            log.warn("Problem not found: problemId: {}", problemId);
        } else {
            log.info("Problem found: problemId: {}", problemId);
            problemOpt.ifPresent(p -> problemMetadataCache.put(problemId, p));
        }

        return problemOpt.orElse(null);
    }

    @Override
    @Cacheable(value = "allProblems")
    public List<Problem> getProblems() {
        log.info("Getting all visible problems with default code");

        List<Problem> problems = problemRepository.getAllNotHiddenProblemsWithDefaultCode();
        log.info("Retrieved {} visible problems", problems.size());

        // Update problem metadata cache
        problems.forEach(p -> problemMetadataCache.put(p.getId(), p));

        return problems;
    }

    /**
     * Preload all problems asynchronously
     */
    public void preloadAllProblems() {
        log.info("Preloading all problems");

        try {
            // Get problem slugs
            List<String> problemSlugs = fileUtil.listProblemSlugs();
            log.info("Found {} problem directories to preload", problemSlugs.size());

            // Get all problems from database
            List<Problem> problems = problemRepository.findAll();

            // Map slug to problem
            Map<String, Problem> problemsBySlug = problems.stream()
                    .collect(Collectors.toMap(Problem::getSlug, p -> p));

            // Preload each problem
            for (String slug : problemSlugs) {
                Problem problem = problemsBySlug.get(slug);
                if (problem == null) {
                    log.warn("Problem slug {} found on filesystem but not in database", slug);
                    continue;
                }

                problemMetadataCache.put(problem.getId(), problem);

                // Preload for each language
                for (LanguageId languageId : LanguageId.values()) {
                    try {
                        // Skip if already cached
                        if (cacheService.getCachedProblemDetails(problem.getId(), languageId).isPresent()) {
                            continue;
                        }

                        // Preload asynchronously
                        CompletableFuture.runAsync(() -> {
                            try {
                                log.debug("Preloading problem {} for language {}", problem.getId(), languageId);
                                getProblem(problem.getId(), languageId);
                            } catch (Exception e) {
                                log.error("Error preloading problem: {}, language: {}",
                                        problem.getId(), languageId, e);
                            }
                        });
                    } catch (Exception e) {
                        log.error("Error scheduling preload for problem: {}, language: {}",
                                problem.getId(), languageId, e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error during problem preloading", e);
        }
    }

    /**
     * Get problem metadata from cache or database
     */
    private Problem getProblemMetadata(String problemId) throws IOException {
        // Check in-memory cache first
        Problem problem = problemMetadataCache.get(problemId);
        if (problem != null) {
            return problem;
        }

        // Fetch from database
        Optional<Problem> problemOpt = problemRepository.findById(problemId);
        if (problemOpt.isEmpty()) {
            log.error("Problem not found in database: {}", problemId);
            throw new IOException("Problem not found");
        }

        problem = problemOpt.get();

        // Update cache
        problemMetadataCache.put(problemId, problem);

        return problem;
    }
}
