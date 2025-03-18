import {ProblemStatement} from "../../components/features/problem/ProblemStatement.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getProblem} from "../../api/problem.ts";


export function ProblemPage() {
    const {problemId} = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchProblem() {
            try {
                const problemData = await getProblem(problemId);
                if (problemData) {
                    setProblem(problemData);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error fetching problem:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchProblem();
    }, [problemId]);

    if (loading) {
        return <div>Loading problem...</div>;
    }

    if (error || !problem) {
        return <div>Problem not found</div>;
    }

    return (
        <div>
            <main>
                <div>
                    <div>
                        <ProblemStatement description={problem.descripton}/>
                    </div>
                </div>
            </main>
        </div>
    )
}