import {Problem} from "../../../types/problem.ts";
import {LANGUAGE_MAPPING} from "../../../constants/languageMapping.ts";
import {useEffect, useState} from "react";
import {SubmitStatus} from "../../../constants/submitStatus.ts";
import {Testcase} from "../../../types/submission.ts";
import {toast} from "react-toastify";

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
    async function pollWithBackOff(id: string, retries: number): Promise<void> {
        if (retries === 0) {
            setStatus(SubmitStatus.SUBMIT);
            toast.error("Could not get submission status");
            return;
        }
    }
}

