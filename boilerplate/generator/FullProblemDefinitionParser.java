package boilerplate.generator;

import boilerplate.generator.ProblemDefinitionParser;

public class FullProblemDefinitionParser extends ProblemDefinitionParser {

    @Override
    public String generateJava() {
        StringBuilder code = new StringBuilder();
        code.append("import java.util.Scanner;\n\n");
        code.append("public class Solution {\n\n");

        code.append("    ").append("##USER_CODE_HERE##").append("\n\n");

        code.append("    public static void main(String[] args) {\n");
        code.append("        Scanner scanner = new Scanner(System.in);\n\n");

        for (Field field : inputFields) {
            if (field.type.startsWith("list<")) {
                code.append(String.format(
                        "        int size_%s = scanner.nextInt();\n" +
                                "        %s %s = new %s[size_%s];\n" +
                                "        for (int i = 0; i < size_%s; i++) {\n" +
                                "            %s[i] = scanner.next%s();\n" +
                                "        }\n",
                        field.name, mapTypeToJava(field.type), field.name,
                        mapTypeToJava(field.type).replace("[]", ""), field.name,
                        field.name, field.name, getJavaScannerMethod(field.type)
                ));
            } else {
                code.append(String.format(
                        "        %s %s = scanner.next%s();\n",
                        mapTypeToJava(field.type), field.name, getJavaScannerMethod(field.type)
                ));
            }
        }

        code.append("\n        ").append(mapTypeToJava(outputFields.get(0).type))
                .append(" result = ").append(functionName).append("(");

        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) code.append(", ");
            code.append(inputFields.get(i).name);
        }

        code.append(");\n");
        code.append("        System.out.println(result);\n");
        code.append("        scanner.close();\n");
        code.append("    }\n");
        code.append("}\n");

        return code.toString();
    }

    @Override
    public String generateCpp() {
        StringBuilder code = new StringBuilder();
        code.append("#include <iostream>\n");
        code.append("#include <vector>\n");
        code.append("#include <string>\n\n");

        code.append("##USER_CODE_HERE##").append("\n\n");

        code.append("int main() {\n");

        for (Field field : inputFields) {
            if (field.type.startsWith("list<")) {
                code.append(String.format(
                        "    int size_%s;\n" +
                                "    std::cin >> size_%s;\n" +
                                "    %s %s(size_%s);\n" +
                                "    for(int i = 0; i < size_%s; ++i) std::cin >> %s[i];\n",
                        field.name, field.name, mapTypeToCpp(field.type),
                        field.name, field.name, field.name, field.name
                ));
            } else {
                code.append(String.format(
                        "    %s %s;\n    std::cin >> %s;\n",
                        mapTypeToCpp(field.type), field.name, field.name
                ));
            }
        }

        code.append(String.format("\n    %s result = %s(",
                mapTypeToCpp(outputFields.get(0).type), functionName));

        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) code.append(", ");
            code.append(inputFields.get(i).name);
        }

        code.append(");\n");
        code.append("    std::cout << result << std::endl;\n");
        code.append("    return 0;\n");
        code.append("}\n");

        return code.toString();
    }

    @Override
    public String generateJs() {
        StringBuilder code = new StringBuilder();

        // Add function declaration
        code.append("##USER_CODE_HERE##").append("\n\n");

        // Add input handling
        code.append("const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n').join(' ').split(' ');\n");

        // Add input reading
        for (Field field : inputFields) {
            if (field.type.startsWith("list<")) {
                code.append(String.format(
                        "const size_%s = parseInt(input.shift());\n" +
                                "const %s = input.splice(0, size_%s).map(Number);\n",
                        field.name, field.name, field.name
                ));
            } else {
                code.append(String.format(
                        "const %s = parseInt(input.shift());\n",
                        field.name
                ));
            }
        }

        // Add function call and output
        code.append(String.format("\nconst result = %s(", functionName));

        for (int i = 0; i < inputFields.size(); i++) {
            if (i > 0) code.append(", ");
            code.append(inputFields.get(i).name);
        }

        code.append(");\n");
        code.append("console.log(result);\n");

        return code.toString();
    }

    private String getJavaScannerMethod(String type) {
        switch (type) {
            case "int":
            case "list<int>":
                return "Int";
            case "float":
            case "list<float>":
                return "Float";
            case "string":
            case "list<string>":
                return "Line";
            case "bool":
            case "list<bool>":
                return "Boolean";
            default:
                return "Line";
        }
    }
}