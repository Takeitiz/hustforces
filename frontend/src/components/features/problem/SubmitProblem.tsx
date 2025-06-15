import type React from "react"
import type { Problem } from "../../../types/problem.ts"
import { LANGUAGE_MAPPING } from "../../../constants/languageMapping.ts"
import { useEffect, useState, useRef } from "react"
import { SubmitStatus } from "../../../constants/submitStatus.ts"
import { toast } from "react-toastify"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/Select.tsx"
import { Button } from "../../ui/Button.tsx"
import Editor, { Monaco } from "@monaco-editor/react"
import submissionService from "../../../service/submissionService.ts"
import { useAuth } from "../../../contexts/AuthContext.tsx"
import { useNavigate } from "react-router-dom"
import { Code, Loader2, CheckCircle, XCircle } from "lucide-react"

/**
 * Props interface for SubmitProblem component
 */
interface SubmitProblemProps {
    problem: Problem
    contestId?: string
    onCodeChange?: (code: string, language: string) => void
    hideSubmitButton?: boolean
}

/**
 * Component for submitting solutions to a problem
 *
 * @param {SubmitProblemProps} props - Component props
 * @returns {JSX.Element}
 */
const SubmitProblem: React.FC<SubmitProblemProps> = ({ problem, contestId, onCodeChange, hideSubmitButton = false }) => {
    const [language, setLanguage] = useState<string>(Object.keys(LANGUAGE_MAPPING)[0])
    const [code, setCode] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT)
    const [, setTestcases] = useState<any[]>([])
    const [isEditorReady, setIsEditorReady] = useState(false)
    const { isLoggedIn } = useAuth()
    const navigate = useNavigate()
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<Monaco | null>(null)

    // Initialize code with problem default code
    useEffect(() => {
        const defaultCode: Record<string, string> = {}
        problem.defaultCode.forEach((codeObj) => {
            const lang = Object.keys(LANGUAGE_MAPPING).find((key) => LANGUAGE_MAPPING[key]?.internal === codeObj.languageId)
            if (!lang) return
            defaultCode[lang] = codeObj.code
        })
        setCode(defaultCode)
    }, [problem])

    useEffect(() => {
        if (onCodeChange && code[language] !== undefined) {
            onCodeChange(code[language], language);
        }
    }, [code, language, onCodeChange]);

    function handleCodeChange(value: string | undefined): void {
        if (value !== undefined) {
            const newCode = { ...code, [language]: value };
            setCode(newCode);

            // Notify parent component
            if (onCodeChange) {
                onCodeChange(value, language);
            }
        }
    }

    /**
     * Poll for submission status with backoff
     *
     * @param {string} id - Submission ID
     * @param {number} retries - Number of retries left
     */
    async function pollWithBackoff(id: string, retries: number): Promise<void> {
        if (retries === 0) {
            setStatus(SubmitStatus.SUBMIT)
            toast.error("Could not get submission status")
            return
        }

        try {
            const submission = await submissionService.getSubmissionStatus(id)

            if (submission.status === "PENDING") {
                setTestcases(submission.testcases)
                await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000))
                pollWithBackoff(id, retries - 1)
            } else {
                if (submission.status === "AC") {
                    setStatus(SubmitStatus.ACCEPTED)
                    setTestcases(submission.testcases)
                    toast.success("Your solution was accepted!")
                } else {
                    setStatus(SubmitStatus.FAILED)
                    setTestcases(submission.testcases)
                    toast.error("Your solution failed some test cases")
                }
            }
        } catch (error) {
            console.error("Error checking submission status:", error)
            toast.error("Failed to check submission status")
            setStatus(SubmitStatus.SUBMIT)
        }
    }

    /**
     * Submit code for evaluation
     */
    async function handleSubmit(): Promise<void> {
        if (!isLoggedIn) {
            navigate("/login")
            toast.info("Please log in to submit solutions")
            return
        }

        setStatus(SubmitStatus.PENDING)
        setTestcases((currentTestcases) => currentTestcases.map((tc) => ({ ...tc, status_id: 1 })))

        try {
            const response = await submissionService.submitCode({
                code: code[language],
                languageId: language,
                problemId: problem.id,
                activeContestId: contestId,
            })

            pollWithBackoff(response.id, 10)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Submission failed"
            toast.error(errorMessage)
            setStatus(SubmitStatus.SUBMIT)
        }
    }

    // /**
    //  * Handle code change in the editor
    //  *
    //  * @param {string} value - New code value
    //  */
    // function handleCodeChange(value: string | undefined): void {
    //     if (value !== undefined) {
    //         setCode({ ...code, [language]: value })
    //     }
    // }

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        editorRef.current = editor
        monacoRef.current = monaco
        setIsEditorReady(true)

        // Configure additional language features for JavaScript
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        })

        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.Latest,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            allowJs: true
        })

        // Add common JavaScript/TypeScript libraries for better auto-completion
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            `declare const console: { log(...args: any[]): void; error(...args: any[]): void; warn(...args: any[]): void; };
             declare const Math: Math;
             declare const Array: ArrayConstructor;
             declare const Object: ObjectConstructor;
             declare const String: StringConstructor;
             declare const Number: NumberConstructor;
             declare const Date: DateConstructor;
             declare const JSON: JSON;
             declare const Promise: PromiseConstructor;`,
            'ts:globals.d.ts'
        )

        // Register custom completion providers for each language
        // C++ Completion Provider
        monaco.languages.registerCompletionItemProvider('cpp', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position)
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                }

                const suggestions = [
                    // Common C++ keywords and structures
                    { label: 'include', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '#include <${1:iostream}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'using namespace std', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'using namespace std;', range },
                    { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'int main() {\n    ${1}\n    return 0;\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'while', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'while (${1:condition}) {\n    ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'vector', kind: monaco.languages.CompletionItemKind.Class, insertText: 'vector<${1:int}> ${2:v};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'sort', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sort(${1:v}.begin(), ${1:v}.end());', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'cout', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'cout << ${1} << endl;', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'cin', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'cin >> ${1};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    // Common STL containers
                    { label: 'map', kind: monaco.languages.CompletionItemKind.Class, insertText: 'map<${1:int}, ${2:int}> ${3:m};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'set', kind: monaco.languages.CompletionItemKind.Class, insertText: 'set<${1:int}> ${2:s};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'pair', kind: monaco.languages.CompletionItemKind.Class, insertText: 'pair<${1:int}, ${2:int}> ${3:p};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'queue', kind: monaco.languages.CompletionItemKind.Class, insertText: 'queue<${1:int}> ${2:q};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'stack', kind: monaco.languages.CompletionItemKind.Class, insertText: 'stack<${1:int}> ${2:st};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'priority_queue', kind: monaco.languages.CompletionItemKind.Class, insertText: 'priority_queue<${1:int}> ${2:pq};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                ]

                return { suggestions }
            }
        })

        // Java Completion Provider
        monaco.languages.registerCompletionItemProvider('java', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position)
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                }

                const suggestions = [
                    { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'public static void main(String[] args) {\n    ${1}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'sout', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'System.out.println(${1});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'foreach', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n    ${4}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n    ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'class', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public class ${1:ClassName} {\n    ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'ArrayList', kind: monaco.languages.CompletionItemKind.Class, insertText: 'ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'HashMap', kind: monaco.languages.CompletionItemKind.Class, insertText: 'HashMap<${1:Integer}, ${2:String}> ${3:map} = new HashMap<>();', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'Scanner', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Scanner ${1:sc} = new Scanner(System.in);', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'Arrays.sort', kind: monaco.languages.CompletionItemKind.Function, insertText: 'Arrays.sort(${1:array});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                ]

                return { suggestions }
            }
        })

        // Rust Completion Provider
        monaco.languages.registerCompletionItemProvider('rust', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position)
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                }

                const suggestions = [
                    { label: 'main', kind: monaco.languages.CompletionItemKind.Function, insertText: 'fn main() {\n    ${1}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'println', kind: monaco.languages.CompletionItemKind.Function, insertText: 'println!("${1}");', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'let', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'let ${1:var} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'let mut', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'let mut ${1:var} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'for', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for ${1:item} in ${2:collection} {\n    ${3}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'if', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if ${1:condition} {\n    ${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'match', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'match ${1:value} {\n    ${2:pattern} => ${3:result},\n    _ => ${4:default},\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'Vec', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Vec<${1:i32}>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'vec!', kind: monaco.languages.CompletionItemKind.Function, insertText: 'vec![${1}]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                    { label: 'use std', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'use std::${1:io};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range },
                ]

                return { suggestions }
            }
        })

        // Define custom themes for better syntax highlighting
        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'function', foreground: 'DCDCAA' },
                { token: 'variable', foreground: '9CDCFE' },
                { token: 'constant', foreground: '4FC1FF' },
                { token: 'parameter', foreground: '9CDCFE' },
                { token: 'property', foreground: '9CDCFE' },
                { token: 'punctuation', foreground: 'D4D4D4' },
                { token: 'operator', foreground: 'D4D4D4' },
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editor.foreground': '#D4D4D4',
                'editor.lineHighlightBackground': '#2A2A2A',
                'editorCursor.foreground': '#FFFFFF',
                'editor.selectionBackground': '#264F78',
                'editor.inactiveSelectionBackground': '#3A3D41'
            }
        })

        // Set the custom theme
        monaco.editor.setTheme('custom-dark')
    }

    // Handle language change
    useEffect(() => {
        if (editorRef.current && monacoRef.current) {
            const model = editorRef.current.getModel()
            if (model) {
                monacoRef.current.editor.setModelLanguage(model, LANGUAGE_MAPPING[language]?.monaco || 'plaintext')
            }
        }
    }, [language, code, onCodeChange])

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <label htmlFor="language" className="block text-sm font-medium mb-1">
                    Select Language
                </label>
                <div className="relative z-30">
                    <Select
                        value={language}
                        defaultValue="cpp"
                        onValueChange={(value) => {
                            setLanguage(value);
                            // Notify parent of language change
                            if (onCodeChange) {
                                const currentCode = code[value] || "";
                                onCodeChange(currentCode, value);
                            }
                        }}
                    >
                        <SelectTrigger
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <SelectValue placeholder="Select language"/>
                        </SelectTrigger>
                        <SelectContent
                            className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            {Object.keys(LANGUAGE_MAPPING).map((lang) => (
                                <SelectItem key={lang} value={lang}>
                                    {LANGUAGE_MAPPING[lang]?.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center">
                        <Code className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"/>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {LANGUAGE_MAPPING[language]?.name || "Code Editor"}
                        </span>
                    </div>
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div
                    className={`transition-opacity duration-300 ${isEditorReady ? "opacity-100" : "opacity-0"} relative z-10`}>
                    <Editor
                        height="60vh"
                        language={LANGUAGE_MAPPING[language]?.monaco || 'plaintext'}
                        theme="custom-dark"
                        value={code[language] || ""}
                        onChange={handleCodeChange}
                        onMount={handleEditorDidMount}
                        className="monaco-editor-wrapper"
                        options={{
                            fontSize: 14,
                            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                            fontLigatures: true,
                            minimap: { enabled: true },
                            scrollBeyondLastLine: false,
                            lineNumbers: "on",
                            wordWrap: "on",
                            automaticLayout: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: {
                                other: true,
                                comments: false,
                                strings: true
                            },
                            parameterHints: {
                                enabled: true
                            },
                            acceptSuggestionOnCommitCharacter: true,
                            acceptSuggestionOnEnter: "on",
                            snippetSuggestions: "top",
                            suggestSelection: "first",
                            tabCompletion: "on",
                            suggest: {
                                localityBonus: true,
                                shareSuggestSelections: true,
                                showKeywords: true,
                                showSnippets: true,
                                showMethods: true,
                                showFunctions: true,
                                showConstructors: true,
                                showFields: true,
                                showVariables: true,
                                showClasses: true,
                                showStructs: true,
                                showInterfaces: true,
                                showModules: true,
                                showProperties: true,
                                showEvents: true,
                                showOperators: true,
                                showUnits: true,
                                showValues: true,
                                showConstants: true,
                                showEnums: true,
                                showEnumMembers: true,
                                showColors: true,
                                showFiles: true,
                                showReferences: true,
                                showFolders: true,
                                showTypeParameters: true,
                                showIssues: true,
                                insertMode: 'replace',
                                filterGraceful: true,
                            },
                            tabSize: 4,
                            insertSpaces: true,
                            folding: true,
                            bracketPairColorization: {
                                enabled: true
                            },
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            smoothScrolling: true,
                            mouseWheelZoom: true,
                            renderWhitespace: "selection",
                            renderLineHighlight: "all",
                            emptySelectionClipboard: false,
                            copyWithSyntaxHighlighting: true,
                            autoIndent: "full",
                            stickyTabStops: true,
                            showFoldingControls: "mouseover",
                            foldingHighlight: true,
                            unfoldOnClickAfterEndOfLine: true,
                            trimAutoWhitespace: true,
                            detectIndentation: true,
                            largeFileOptimizations: true,
                            maxTokenizationLineLength: 20000,
                            autoClosingBrackets: "languageDefined",
                            autoClosingQuotes: "languageDefined",
                            autoClosingOvertype: "always",
                            autoSurround: "languageDefined",
                            links: true,
                            colorDecorators: true,
                            selectionHighlight: true,
                            overviewRulerBorder: false,
                            hideCursorInOverviewRuler: false,
                            revealHorizontalRightPadding: 30,
                        }}
                        loading={
                            <div className="flex items-center justify-center h-[60vh] bg-gray-900">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        }
                    />
                </div>
            </div>

            {!hideSubmitButton && (
                <div className="flex justify-end">
                    <Button
                        disabled={status === SubmitStatus.PENDING}
                        type="submit"
                        className={`px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-300 flex items-center gap-2 ${
                            status === SubmitStatus.ACCEPTED
                                ? "bg-green-600 hover:bg-green-700"
                                : status === SubmitStatus.FAILED
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        }`}
                        onClick={handleSubmit}
                    >
                        {!isLoggedIn ? (
                            "Login to Submit"
                        ) : status === SubmitStatus.PENDING ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : status === SubmitStatus.ACCEPTED ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Accepted
                            </>
                        ) : status === SubmitStatus.FAILED ? (
                            <>
                                <XCircle className="w-5 h-5" />
                                Failed
                            </>
                        ) : (
                            "Submit Solution"
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default SubmitProblem