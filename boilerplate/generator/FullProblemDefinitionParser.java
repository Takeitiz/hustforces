package boilerplate.generator;

import java.io.*;
import java.util.*;
import java.util.regex.*;

public class FullProblemDefinitionParser {
    private String problemName = "";
    private String functionName = "";
    private List<Field> inputFields = new ArrayList<>();
    private List<Field> outputFields = new ArrayList<>();

    public static class Field {
        private String type;
        private String name;

        public Field(String type, String name) {
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
                this.problemName = extractQuotedValue(line);
            } else if (line.startsWith("Function Name:")) {
                this.functionName = extractValue(line);
            } else if (line.startsWith("Input Structure:")) {
                currentSection = "input";
            } else if (line.startsWith("Output Structure:")) {
                currentSection = "output";
            } else if (line.startsWith("Input Field:")) {
                if ("input".equals(currentSection)) {
                    Field field = extractField(line);
                    if (field != null) {
                        inputFields.add(field);
                    }
                }
            } else if (line.startsWith("Output Field:")) {
                if ("output".equals(currentSection)) {
                    Field field = extractField(line);
                    if (field != null) {
                        outputFields.add(field);
                    }
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
        StringBuilder sb = new StringBuilder();

        // Generate input parameters
        String inputs = inputFields.stream()
                .map(field -> mapTypeToCpp(field.getType()) + " " + field.getName())
                .reduce((a, b) -> a + ", " + b)
                .orElse("");

        // Generate input reads
        StringBuilder inputReads = new StringBuilder();
        for (int i = 0; i < inputFields.size(); i++) {
            Field field = inputFields.get(i);
            if (field.getType().startsWith("list<")) {
                inputReads.append(String.format(
                        "int size_%s;\n  std::istringstream(lines[%d]) >> size_%s;\n  %s %s(size_%s);\n" +
                                "  if(!size_%s==0) {\n    std::istringstream iss(lines[%d]);\n" +
                                "    for (int i=0; i < size_arr; i++) iss >> arr[i];\n  }",
                        field.getName(), i, field.getName(), mapTypeToCpp(field.getType()),
                        field.getName(), field.getName(), field.getName(), i + 1
                ));
            } else {
                inputReads.append(String.format(
                        "%s %s;\n  std::istringstream(lines[%d]) >> %s;",
                        mapTypeToCpp(field.getType()), field.getName(), i, field.getName()
                ));
            }
            if (i < inputFields.size() - 1) {
                inputReads.append("\n  ");
            }
        }

        String template = String.format(
                "#include <iostream>\n" +
                        "#include <fstream>\n" +
                        "#include <vector>\n" +
                        "#include <string>\n" +
                        "#include <sstream>\n" +
                        "#include <climits>\n\n" +
                        "##USER_CODE_HERE##\n\n" +
                        "int main() {\n" +
                        "  std::ifstream file(\"/dev/problems/%s/tests/inputs/##INPUT_FILE_INDEX##.txt\");\n" +
                        "  std::vector<std::string> lines;\n" +
                        "  std::string line;\n" +
                        "  while (std::getline(file, line)) lines.push_back(line);\n\n" +
                        "  file.close();\n" +
                        "  %s\n" +
                        "  %s result = %s(%s);\n" +
                        "  std::cout << result << std::endl;\n" +
                        "  return 0;\n" +
                        "}",
                problemName.toLowerCase().replace(" ", "-"),
                inputReads.toString(),
                outputFields.get(0).getType(),
                functionName,
                inputFields.stream().map(Field::getName).reduce((a, b) -> a + ", " + b).orElse("")
        );

        return template;
    }

    public String generateJava() {
        StringBuilder sb = new StringBuilder();
        int inputReadIndex = 0;

        // Generate input reads
        StringBuilder inputReads = new StringBuilder();
        for (Field field : inputFields) {
            if (field.getType().startsWith("list<")) {
                String javaType = mapTypeToJava(field.getType());
                String inputType = extractGenericType(javaType);
                String parseToType = inputType.equals("Integer") ? "Int" : inputType;

                inputReads.append(String.format(
                        "int size_%s = Integer.parseInt(lines.get(%d).trim());\n\n" +
                                "        %s %s = new ArrayList<>(size_%s);\n" +
                                "        String[] inputStream = lines.get(%d).trim().split(\"\\\\s+\");\n" +
                                "        for (String inputChar : inputStream) {\n" +
                                "          %s.add(%s.parse%s(inputChar));\n" +
                                "        }\n",
                        field.getName(), inputReadIndex++,
                        mapTypeToJava(field.getType()), field.getName(), field.getName(),
                        inputReadIndex++,
                        field.getName(), inputType, parseToType
                ));
            } else {
                String javaType = mapTypeToJava(field.getType());
                String wrapperType = getWrapperType(javaType);
                String parseToType = wrapperType.equals("Integer") ? "Int" : wrapperType;

                inputReads.append(String.format(
                        "%s %s = %s.parse%s(lines.get(%d).trim());",
                        javaType, field.getName(), wrapperType, parseToType, inputReadIndex++
                ));
            }
            inputReads.append("\n  ");
        }

        String template = String.format(
                "\nimport java.io.*;\n" +
                        "import java.util.*;\n\n" +
                        "public class Main {\n" +
                        "    \n" +
                        "    ##USER_CODE_HERE##\n\n" +
                        "    public static void main(String[] args) {\n" +
                        "        String filePath = \"/dev/problems/%s/tests/inputs/##INPUT_FILE_INDEX##.txt\";\n" +
                        "        List<String> lines = readLinesFromFile(filePath);\n" +
                        "        %s\n" +
                        "        %s result = %s(%s);\n" +
                        "        System.out.println(result);\n" +
                        "    }\n\n" +
                        "    public static List<String> readLinesFromFile(String filePath) {\n" +
                        "        List<String> lines = new ArrayList<>();\n" +
                        "        try (BufferedReader br = new BufferedReader(new FileReader(filePath))) {\n" +
                        "            String line;\n" +
                        "            while ((line = br.readLine()) != null) {\n" +
                        "                lines.add(line);\n" +
                        "            }\n" +
                        "        } catch (IOException e) {\n" +
                        "            e.printStackTrace();\n" +
                        "        }\n" +
                        "        return lines;\n" +
                        "    }\n" +
                        "}",
                problemName.toLowerCase().replace(" ", "-"),
                inputReads.toString(),
                mapTypeToJava(outputFields.get(0).getType()),
                functionName,
                inputFields.stream().map(Field::getName).reduce((a, b) -> a + ", " + b).orElse("")
        );

        return template;
    }

    private String extractGenericType(String type) {
        Pattern pattern = Pattern.compile("List<(.*)>");
        Matcher matcher = pattern.matcher(type);
        return matcher.find() ? matcher.group(1) : type;
    }

    private String getWrapperType(String primitiveType) {
        switch (primitiveType) {
            case "int": return "Integer";
            case "float": return "Float";
            case "boolean": return "Boolean";
            case "String": return "String";
            default: return primitiveType;
        }
    }

    public String generateJs() {
        StringBuilder inputReads = new StringBuilder();
        for (Field field : inputFields) {
            if (field.getType().startsWith("list<")) {
                inputReads.append(String.format(
                        "const size_%s = parseInt(input.shift());\n" +
                                "const %s = input.splice(0, size_%s).map(Number);",
                        field.getName(), field.getName(), field.getName()
                ));
            } else {
                inputReads.append(String.format(
                        "const %s = parseInt(input.shift());",
                        field.getName()
                ));
            }
            inputReads.append("\n  ");
        }

        return String.format(
                "##USER_CODE_HERE##\n\n" +
                        "const input = require('fs').readFileSync('/dev/problems/%s/tests/inputs/##INPUT_FILE_INDEX##.txt', 'utf8').trim().split('\\n').join(' ').split(' ');\n" +
                        "%s\n" +
                        "const result = %s(%s);\n" +
                        "console.log(result);\n",
                problemName.toLowerCase().replace(" ", "-"),
                inputReads.toString(),
                functionName,
                inputFields.stream().map(Field::getName).reduce((a, b) -> a + ", " + b).orElse("")
        );
    }

    public String generateRust() {
        StringBuilder inputReads = new StringBuilder();
        boolean containsVector = false;

        for (Field field : inputFields) {
            if (field.getType().startsWith("list<")) {
                containsVector = true;
                inputReads.append(String.format(
                        "let size_%s: usize = lines.next().and_then(|line| line.parse().ok()).unwrap_or(0);\n" +
                                "\tlet %s: %s = parse_input(lines, size_%s);",
                        field.getName(), field.getName(), mapTypeToRust(field.getType()), field.getName()
                ));
            } else {
                inputReads.append(String.format(
                        "let %s: %s = lines.next().unwrap().parse().unwrap();",
                        field.getName(), mapTypeToRust(field.getType())
                ));
            }
            inputReads.append("\n  ");
        }

        String template = String.format(
                "use std::fs::read_to_string;\n" +
                        "use std::io::{self};\n" +
                        "use std::str::Lines;\n\n" +
                        "##USER_CODE_HERE##\n\n" +
                        "fn main() -> io::Result<()> {\n" +
                        "  let input = read_to_string(\"/dev/problems/%s/tests/inputs/##INPUT_FILE_INDEX##.txt\")?;\n" +
                        "  let mut lines = input.lines();\n" +
                        "  %s\n" +
                        "  let result = %s(%s);\n" +
                        "  println!(\"{}\", result);\n" +
                        "  Ok(())\n" +
                        "}" +
                        (containsVector ? "\nfn parse_input(mut input: Lines, size_arr: usize) -> Vec<i32> {\n" +
                                "    let arr: Vec<i32> = input\n" +
                                "        .next()\n" +
                                "        .unwrap_or_default()\n" +
                                "        .split_whitespace()\n" +
                                "        .filter_map(|x| x.parse().ok())\n" +
                                "        .collect();\n\n" +
                                "    if size_arr == 0 {\n" +
                                "        Vec::new()\n" +
                                "    } else {\n" +
                                "        arr\n" +
                                "    }\n" +
                                "}" : ""),
                problemName.toLowerCase().replace(" ", "-"),
                inputReads.toString(),
                functionName,
                inputFields.stream().map(Field::getName).reduce((a, b) -> a + ", " + b).orElse("")
        );

        return template;
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
}
