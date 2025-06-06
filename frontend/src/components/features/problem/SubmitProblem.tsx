import type React from "react"
import type { Problem } from "../../../types/problem.ts"
import { LANGUAGE_MAPPING } from "../../../constants/languageMapping.ts"
import { useEffect, useState, useRef } from "react"
import { SubmitStatus } from "../../../constants/submitStatus.ts"
import { toast } from "react-toastify"
import { Label } from "../../ui/Label.tsx"
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
}

/**
 * Component for submitting solutions to a problem
 *
 * @param {SubmitProblemProps} props - Component props
 * @returns {JSX.Element}
 */
const SubmitProblem: React.FC<SubmitProblemProps> = ({ problem, contestId }) => {
    const [language, setLanguage] = useState<string>(Object.keys(LANGUAGE_MAPPING)[0])
    const [code, setCode] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT)
    const [testcases, setTestcases] = useState<any[]>([])
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

    /**
     * Handle code change in the editor
     *
     * @param {string} value - New code value
     */
    function handleCodeChange(value: string | undefined): void {
        if (value !== undefined) {
            setCode({ ...code, [language]: value })
        }
    }

    function handleEditorDidMount(editor: any, monaco: Monaco) {
        editorRef.current = editor
        monacoRef.current = monaco
        setIsEditorReady(true)

        // Configure additional language features
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
    }, [language])

    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="language" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Select Language
                </Label>
                <div className="relative z-30">
                    <Select value={language} defaultValue="cpp" onValueChange={(value) => setLanguage(value)}>
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
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
                        <Code className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
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
                <div className={`transition-opacity duration-300 ${isEditorReady ? "opacity-100" : "opacity-0"} relative z-10`}>
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
                                comments: true,
                                strings: true
                            },
                            parameterHints: {
                                enabled: true
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
                            renderIndentGuides: true,
                            suggestSelection: "first",
                            acceptSuggestionOnCommitCharacter: true,
                            snippetSuggestions: "top",
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
                            enableSplitViewResizing: true,
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
        </div>
    )
}

export default SubmitProblem