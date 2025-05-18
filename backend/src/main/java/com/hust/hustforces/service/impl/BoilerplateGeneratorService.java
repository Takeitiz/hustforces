package com.hust.hustforces.service.impl;

import com.hust.hustforces.utils.FullProblemDefinitionParser;
import com.hust.hustforces.utils.ProblemDefinitionParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class BoilerplateGeneratorService {

    public List<String> generateBoilerplateCode(String problemPath) throws Exception {
        log.info("Generating boilerplate code for problem: {}", problemPath);

        List<String> generatedFiles = new ArrayList<>();

        try {
            // Read the structure file
            String input = new String(Files.readAllBytes(Paths.get(problemPath, "Structure.md")));

            // Create basic boilerplate
            ProblemDefinitionParser basicParser = new ProblemDefinitionParser();
            basicParser.parse(input);

            Files.write(Paths.get(problemPath, "boilerplate", "function.java"),
                    basicParser.generateJava().getBytes());
            generatedFiles.add("boilerplate/function.java");

            Files.write(Paths.get(problemPath, "boilerplate", "function.cpp"),
                    basicParser.generateCpp().getBytes());
            generatedFiles.add("boilerplate/function.cpp");

            Files.write(Paths.get(problemPath, "boilerplate", "function.js"),
                    basicParser.generateJs().getBytes());
            generatedFiles.add("boilerplate/function.js");

            Files.write(Paths.get(problemPath, "boilerplate", "function.rs"),
                    basicParser.generateRust().getBytes());
            generatedFiles.add("boilerplate/function.rs");

            // Create full boilerplate
            FullProblemDefinitionParser fullParser = new FullProblemDefinitionParser();
            fullParser.parse(input);

            Files.write(Paths.get(problemPath, "boilerplate-full", "Solution.java"),
                    fullParser.generateJava().getBytes());
            generatedFiles.add("boilerplate-full/Solution.java");

            Files.write(Paths.get(problemPath, "boilerplate-full", "solution.cpp"),
                    fullParser.generateCpp().getBytes());
            generatedFiles.add("boilerplate-full/solution.cpp");

            Files.write(Paths.get(problemPath, "boilerplate-full", "solution.js"),
                    fullParser.generateJs().getBytes());
            generatedFiles.add("boilerplate-full/solution.js");

            Files.write(Paths.get(problemPath, "boilerplate-full", "solution.rs"),
                    fullParser.generateRust().getBytes());
            generatedFiles.add("boilerplate-full/solution.rs");

            log.info("Successfully generated boilerplate code: {}", generatedFiles);
            return generatedFiles;
        } catch (Exception e) {
            log.error("Error generating boilerplate code", e);
            throw new RuntimeException("Failed to generate boilerplate code", e);
        }
    }
}