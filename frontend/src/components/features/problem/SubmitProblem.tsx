import {Problem} from "../../../types/problem.ts";
import {LANGUAGE_MAPPING} from "../../../constants/languageMapping.ts";
import {useEffect, useState} from "react";
import {SubmitStatus} from "../../../constants/submitStatus.ts";
import {Testcase} from "../../../types/submission.ts";
import {toast} from "react-toastify";
import {Label} from "../../ui/Label.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../../ui/Select.tsx";
import {Button} from "../../ui/Button.tsx";
import MonacoEditor from 'react-monaco-editor';
import RenderTestcase from "./RenderTestcase.tsx";
import submissionService from "../../../service/submissionService.ts";
import {useAuth} from "../../../contexts/AuthContext.tsx";
import {useNavigate} from "react-router-dom";

/**
 * Props interface for SubmitProblem component
 */
interface SubmitProblemProps {
    problem: Problem;
    contestId?: string;
}

/**
 * Component for submitting solutions to a problem
 *
 * @param {SubmitProblemProps} props - Component props
 * @returns {JSX.Element}
 */
const SubmitProblem: React.FC<SubmitProblemProps> = ({ problem, contestId }) => {
    const [language, setLanguage] = useState<string>(
        Object.keys(LANGUAGE_MAPPING)[0]
    );
    const [code, setCode] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT);
    const [testcases, setTestcases] = useState<Testcase[]>([]);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();


    // Initialize code with problem default code
    useEffect(() => {
        const defaultCode: Record<string, string> = {};
        problem.defaultCode.forEach((codeObj) => {
            const lang = Object.keys(LANGUAGE_MAPPING).find(
                (key) => LANGUAGE_MAPPING[key]?.internal === codeObj.languageId
            );
            if (!lang) return;
            defaultCode[lang] = codeObj.code;
        });
        setCode(defaultCode);
    }, [problem]);

    /**
     * Poll for submission status with backoff
     *
     * @param {string} id - Submission ID
     * @param {number} retries - Number of retries left
     */
    async function pollWithBackoff(id: string, retries: number): Promise<void> {
        if (retries === 0) {
            setStatus(SubmitStatus.SUBMIT);
            toast.error("Could not get submission status");
            return;
        }

        try {
            const submission = await submissionService.getSubmissionStatus(id);

            if (submission.status === "PENDING") {
                setTestcases(submission.testcases);
                await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
                pollWithBackoff(id, retries - 1);
            } else {
                if (submission.status === "AC") {
                    setStatus(SubmitStatus.ACCEPTED);
                    setTestcases(submission.testcases);
                    toast.success("Your solution was accepted!");
                } else {
                    setStatus(SubmitStatus.FAILED);
                    setTestcases(submission.testcases);
                    toast.error("Your solution failed some test cases");
                }
            }
        } catch (error) {
            console.error("Error checking submission status:", error);
            toast.error("Failed to check submission status");
            setStatus(SubmitStatus.SUBMIT);
        }
    }

    /**
     * Submit code for evaluation
     */
    async function handleSubmit(): Promise<void> {
        if (!isLoggedIn) {
            navigate("/login");
            toast.info("Please log in to submit solutions");
            return;
        }

        setStatus(SubmitStatus.PENDING);
        setTestcases((currentTestcases) =>
            currentTestcases.map((tc) => ({ ...tc, status_id: 1 }))
        );

        try {
            const response = await submissionService.submitCode({
                code: code[language],
                languageId: language,
                problemId: problem.id,
                activeContestId: contestId
            });

            pollWithBackoff(response.id, 10);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Submission failed";
            toast.error(errorMessage);
            setStatus(SubmitStatus.SUBMIT);
        }
    }

    /**
     * Handle code change in the editor
     *
     * @param {string} value - New code value
     */
    function handleCodeChange(value: string | undefined): void {
        if (value != undefined) {
            setCode({ ...code, [language]: value });
        }
    }

    return (
        <div>
            <Label htmlFor="language">Language</Label>
            <Select
                value={language}
                defaultValue="cpp"
                onValueChange={(value) => setLanguage(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(LANGUAGE_MAPPING).map((language) => (
                        <SelectItem key={language} value={language}>
                            {LANGUAGE_MAPPING[language]?.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <div className="pt-4 rounded-md">
                <MonacoEditor
                    height="60vh"
                    language={LANGUAGE_MAPPING[language]?.monaco}
                    theme="vs-dark"
                    value={code[language] || ''}
                    options={{
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: true },
                        lineNumbers: "on",
                        wordWrap: "on"
                    }}
                    onChange={handleCodeChange}
                />
            </div>

            <div className="flex justify-end">
                <Button
                    disabled={status === SubmitStatus.PENDING}
                    type="submit"
                    className="mt-4 align-right"
                    onClick={handleSubmit}>
                    {!isLoggedIn
                        ? "Login to Submit"
                        : status === SubmitStatus.PENDING
                            ? "Submitting..."
                            : "Submit Solution"}
                </Button>
            </div>
            <RenderTestcase testcases={testcases} />
        </div>
    )
}

export default SubmitProblem;
