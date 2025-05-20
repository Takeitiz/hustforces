import type React from "react"
import type { Problem } from "../../../types/problem.ts"
import { LANGUAGE_MAPPING } from "../../../constants/languageMapping.ts"
import { useEffect, useState } from "react"
import { SubmitStatus } from "../../../constants/submitStatus.ts"
import { toast } from "react-toastify"
import { Label } from "../../ui/Label.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/Select.tsx"
import { Button } from "../../ui/Button.tsx"
import MonacoEditor from "react-monaco-editor"
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
        if (value != undefined) {
            setCode({ ...code, [language]: value })
        }
    }

    function handleEditorDidMount() {
        setIsEditorReady(true)
    }

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
                            {Object.keys(LANGUAGE_MAPPING).map((language) => (
                                <SelectItem key={language} value={language}>
                                    {LANGUAGE_MAPPING[language]?.name}
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
                    <MonacoEditor
                        height="60vh"
                        language={LANGUAGE_MAPPING[language]?.monaco}
                        theme="vs-dark"
                        value={code[language] || ""}
                        options={{
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            minimap: { enabled: true },
                            lineNumbers: "on",
                            wordWrap: "on",
                            automaticLayout: true,
                            fontFamily: "'Fira Code', monospace",
                            fontLigatures: true,
                        }}
                        onChange={handleCodeChange}
                        editorDidMount={handleEditorDidMount}
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

            {/*{testcases.length > 0 && (*/}
            {/*    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">*/}
            {/*        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Test Results</h3>*/}
            {/*        <RenderTestcase testcases={testcases} />*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    )
}

export default SubmitProblem

