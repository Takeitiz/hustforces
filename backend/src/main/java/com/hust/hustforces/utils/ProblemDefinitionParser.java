package com.hust.hustforces.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ProblemDefinitionParser {
    protected String problemName = "";
    protected String functionName = "";
    protected List<Field> inputFields = new ArrayList<>();
    protected List<Field> outputFields = new ArrayList<>();


    static class Field {
        String type;
        String name;

        Field(String type, String name) {
            this.type = type;
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public String getName() {
            return name;
        }
    }

    public void parse(String input) {
        String[] lines = input.split("\n");
        String currentSection = null;

        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("Problem Name:")) {
                problemName = extractQuotedValue(line);
            }
            else if (line.startsWith("Function Name:")) {
                functionName = extractValue(line);
            }
            else if (line.startsWith("Input Structure:")) {
                currentSection = "input";
            }
            else if (line.startsWith("Output Structure:")) {
                currentSection = "output";
            }
            else if (line.startsWith("Input Field:")) {
                if ("input".equals(currentSection)) {
                    Field field = extractField(line);
                    if (field != null) inputFields.add(field);
                }
            }
            else if (line.startsWith("Output Field:")) {
                if ("output".equals(currentSection)) {
                    Field field = extractField(line);
                    if (field != null) outputFields.add(field);
                }
            }
        }
    }

    private String extractQuotedValue(String line) {
        Pattern pattern = Pattern.compile(": \"(.*)\"$");
        Matcher matcher = pattern.matcher(line);
        return matcher.find() ? matcher.group(1) : "";
    }

    private String extractValue(String line) {
        Pattern pattern = Pattern.compile(": (\\w+)$");
        Matcher matcher = pattern.matcher(line);
        return matcher.find() ? matcher.group(1) : "";
    }

    private Field extractField(String line) {
        Pattern pattern = Pattern.compile("Field: (\\w+(?:<\\w+>)?) (\\w+)$");
        Matcher matcher = pattern.matcher(line);
        return matcher.find() ? new Field(matcher.group(1), matcher.group(2)) : null;
    }

    public String generateCpp() {
        StringBuilder inputs = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) inputs.append(", ");
            Field field = inputFields.get(i);
            inputs.append(mapTypeToCpp(field.getType())).append(" ").append(field.getName());
        }
        return String.format("%s %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                mapTypeToCpp(outputFields.get(0).getType()),
                functionName,
                inputs.toString());
    }

    public String generateJs() {
        StringBuilder inputs = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) inputs.append(", ");
            inputs.append(inputFields.get(i).getName());
        }
        return String.format("function %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                functionName,
                inputs.toString());
    }

    public String generateRust() {
        StringBuilder inputs = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) inputs.append(", ");
            Field field = inputFields.get(i);
            inputs.append(field.getName()).append(": ").append(mapTypeToRust(field.getType()));
        }
        String outputType = mapTypeToRust(outputFields.get(0).getType());
        return String.format("fn %s(%s) -> %s {\n    // Implementation goes here\n    result\n}",
                functionName,
                inputs.toString(),
                outputType);
    }

    public String generateJava() {
        StringBuilder inputs = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) inputs.append(", ");
            Field field = inputFields.get(i);
            inputs.append(mapTypeToJava(field.getType())).append(" ").append(field.getName());
        }
        return String.format("public static %s %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                mapTypeToJava(outputFields.get(0).getType()),
                functionName,
                inputs.toString());
    }

    private String mapTypeToCpp(String type) {
        switch (type) {
            case "int": return "int";
            case "float": return "float";
            case "string": return "std::string";
            case "bool": return "bool";
            case "list<int>": return "std::vector<int>";
            case "list<float>": return "std::vector<float>";
            case "list<string>": return "std::vector<std::string>";
            case "list<bool>": return "std::vector<bool>";
            default: return "unknown";
        }
    }

    private String mapTypeToJava(String type) {
        switch (type) {
            case "int": return "int";
            case "float": return "float";
            case "string": return "String";
            case "bool": return "boolean";
            case "list<int>": return "List<Integer>";
            case "list<float>": return "List<Float>";
            case "list<string>": return "List<String>";
            case "list<bool>": return "List<Boolean>";
            default: return "unknown";
        }
    }

    private String mapTypeToRust(String type) {
        switch (type) {
            case "int": return "i32";
            case "float": return "f64";
            case "string": return "String";
            case "bool": return "bool";
            case "list<int>": return "Vec<i32>";
            case "list<float>": return "Vec<f64>";
            case "list<string>": return "Vec<String>";
            case "list<bool>": return "Vec<bool>";
            default: return "unknown";
        }
    }
}
