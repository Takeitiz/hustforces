import {ProblemStatement} from "../../components/features/problem/ProblemStatement.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {getProblem} from "../../api/problem.ts";
import {Problem} from "../../types/problem.ts";


export function ProblemPage() {
    const { problemId } = useParams<{ problemId: string }>();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchProblem() {
            if (!problemId) {
                setError(true);
                setLoading(false);
                return;
            }

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
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 py-8 md:py-12 grid md:grid-cols-2 gap-8 md:gap-12">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                    <div className="prose prose-stone dark:prose-invert">
                        <ProblemStatement description={problem.description}/>
                    </div>
                </div>
            </main>

        </div>
    )
}