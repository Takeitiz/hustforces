import {Problem, Submission} from "../../../types/problem.ts";
import {useEffect, useState} from "react";
import {toast} from "react-toastify";
import {SubmissionTable} from "./SubmissionTable.tsx";

/**
 * Props interface for Submissions component
 */
interface SubmissionsProps {
    problem: Problem
}

/**
 * Component for displaying user submissions for a problem
 *
 * @param {SubmissionsProps} props - Component props
 * @returns {JSX.Element}
 */
const Submissions: React.FC<SubmissionsProps> = ({ problem }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchSubmissions = async (): Promise<void> => {
            try {
                setLoading(true);
                const data = await submissionService.getSubmissions(problem.id);
                setSubmissions(data);
            } catch (error) {
                console.error("Failed to fetch submissions:", error);
                toast.error("Failed to load submissions");
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [problem.id]);

    if (loading) {
        return <div className="loading-state">Loading submissions...</div>;
    }

    return (
        <div>
            <SubmissionTable submissions={submissions} />
        </div>
    )
}

export default Submissions;
