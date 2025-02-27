package com.hust.hustforces.service.impl;

import com.hust.hustforces.model.dto.Judge0Language;
import com.hust.hustforces.model.entity.DefaultCode;
import com.hust.hustforces.model.entity.Language;
import com.hust.hustforces.model.entity.Problem;
import com.hust.hustforces.repository.DefaultCodeRepository;
import com.hust.hustforces.repository.LanguageRepository;
import com.hust.hustforces.repository.ProblemRepository;
import com.hust.hustforces.service.ImportService;
import com.hust.hustforces.utils.LanguageMapping;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class ImportServiceImpl implements ImportService {
    private static final Logger logger =    LoggerFactory.getLogger(ImportServiceImpl.class);

    @Value("${mount.path}")
    private String mountPath;

    @Autowired
    private ProblemRepository problemRepository;
    @Autowired
    private LanguageMapping languageMapping;
    @Autowired
    private DefaultCodeRepository defaultCodeRepository;
    @Autowired
    private LanguageRepository languageRepository;

    @Override
    public void processProblem(String problemSlug) throws IOException {
        String problemStatement = readFile(mountPath + "/" + problemSlug + "/Problem.md");
        Problem problem = problemRepository.findBySlug(problemSlug).orElse(new Problem());

        problem.setSlug(problemSlug);
        problem.setTitle(problemSlug);
        problem.setDescription(problemStatement);
        problem.setHidden(false);

        problem = problemRepository.save(problem);

        final Problem savedProblem = problem;

        languageMapping.getSupportedLanguages().forEach(language -> {
            try {
                String codePath = String.format("%s/%s/boilerplate/function.%s", mountPath, problemSlug, language);
                String code = readFile(codePath);

                Judge0Language lang = languageMapping.getMapping(language);
                DefaultCode defaultCode = defaultCodeRepository
                        .findByProblemIdAndLanguageId(savedProblem.getId(),(int) lang.getInternal())
                        .orElse(new DefaultCode());

                defaultCode.setProblemId(savedProblem.getId());
                defaultCode.setProblem(savedProblem);
                defaultCode.setLanguageId((int) lang.getInternal());
                defaultCode.setCode(code);

                defaultCodeRepository.save(defaultCode);
            } catch (IOException e) {
                logger.error("Error processing boilerplate for language {} in problem {}", language, problemSlug, e);
            }
        });
    }

    @Override
    public void addProblemsInDB() {
        try (Stream<Path> paths = Files.list(Path.of(mountPath))) {
            paths.filter(Files::isDirectory)
                    .map(path -> path.getFileName().toString())
                    .forEach(dir -> {
                        try {
                            processProblem(dir);
                        } catch (IOException e) {
                            logger.error("Error", e);

                        }
                    });
        } catch (IOException e) {
            logger.error("Error", e);
        }
    }

    @Override
    public void seedLanguagesFromMapping() {
        try {
            List<Language> languages = new ArrayList<>();

            languageMapping.getSupportedLanguages().forEach(langKey -> {
                Judge0Language lang = languageMapping.getMapping(langKey);
                Language language = new Language();
                language.setId(lang.getInternal());
                language.setName(langKey);
                language.setJudge0Id(lang.getJudge0());
                languages.add(language);
            });

            languageRepository.saveAll(languages);
            logger.info("Languages from mapping seeded successfully");
        } catch (DataIntegrityViolationException e) {
            logger.info("Languages already persist seeded in the DB!");
        } catch (Exception e) {
            logger.error("Error seeding languages from mapping", e);
        }
    }

    private String readFile(String path) throws IOException {
        return Files.readString(Path.of(path));
    }
}
