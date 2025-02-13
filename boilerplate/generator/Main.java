package boilerplate.generator;

import java.io.*;
import java.nio.file.*;

public class Main {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Please provide the generator file path");
            return;
        }

        String generatorFilePath = args[0];
        try {
            String input = new String(Files.readAllBytes(Paths.get(generatorFilePath, "Structure.md")));

            ProblemDefinitionParser basicParser = new ProblemDefinitionParser();
            basicParser.parse(input);

            FullProblemDefinitionParser fullParser = new FullProblemDefinitionParser();
            fullParser.parse(input);

            Files.createDirectories(Paths.get(generatorFilePath, "boilerplate"));
            Files.createDirectories(Paths.get(generatorFilePath, "boilerplate-full"));

            Files.write(Paths.get(generatorFilePath, "boilerplate", "function.java"),
                    basicParser.generateJava().getBytes());
            Files.write(Paths.get(generatorFilePath, "boilerplate", "function.cpp"),
                    basicParser.generateCpp().getBytes());
            Files.write(Paths.get(generatorFilePath, "boilerplate", "function.js"),
                    basicParser.generateJs().getBytes());

            Files.write(Paths.get(generatorFilePath, "boilerplate-full", "Solution.java"),
                    fullParser.generateJava().getBytes());
            Files.write(Paths.get(generatorFilePath, "boilerplate-full", "solution.cpp"),
                    fullParser.generateCpp().getBytes());
            Files.write(Paths.get(generatorFilePath, "boilerplate-full", "solution.js"),
                    fullParser.generateJs().getBytes());

            System.out.println("All boilerplate code generated successfully!");
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}