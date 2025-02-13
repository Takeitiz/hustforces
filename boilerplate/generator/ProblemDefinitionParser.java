package boilerplate.generator;

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

    public String generateJava() {
        StringBuilder params = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            Field field = inputFields.get(i);
            if (i > 0) params.append(", ");
            params.append(mapTypeToJava(field.type)).append(" ").append(field.name);
        }

        String returnType = mapTypeToJava(outputFields.get(0).type);

        return String.format("public static %s %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                returnType, functionName, params.toString());
    }

    public String generateCpp() {
        StringBuilder params = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            Field field = inputFields.get(i);
            if (i > 0) params.append(", ");
            params.append(mapTypeToCpp(field.type)).append(" ").append(field.name);
        }

        String returnType = mapTypeToCpp(outputFields.get(0).type);

        return String.format("%s %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                returnType, functionName, params.toString());
    }

    public String generateJs() {
        StringBuilder params = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            Field field = inputFields.get(i);
            if (i > 0) params.append(", ");
            params.append(field.name);
        }

        return String.format("function %s(%s) {\n    // Implementation goes here\n    return result;\n}",
                functionName, params.toString());
    }

    protected String mapTypeToCpp(String type) {
        switch (type) {
            case "int": return "int";
            case "float": return "float";
            case "string": return "std::string";
            case "bool": return "bool";
            case "list<int>": return "std::vector<int>";
            case "list<float>": return "std::vector<float>";
            case "list<string>": return "std::vector<std::string>";
            case "list<bool>": return "std::vector<bool>";
            default: return "void";
        }
    }

    protected String mapTypeToJava(String type) {
        switch (type) {
            case "int": return "int";
            case "float": return "float";
            case "string": return "String";
            case "bool": return "boolean";
            case "list<int>": return "int[]";
            case "list<float>": return "float[]";
            case "list<string>": return "String[]";
            case "list<bool>": return "boolean[]";
            default: return "Object";
        }
    }
}