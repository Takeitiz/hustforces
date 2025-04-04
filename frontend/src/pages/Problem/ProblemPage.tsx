import { ProblemStatement } from "../../components/features/problem/ProblemStatement.tsx";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Problem } from "../../types/problem.ts";
import { ProblemSubmitBar } from "../../components/features/problem/ProblemSubmitBar.tsx";
import { toast } from "react-toastify";
import problemService from "../../service/problemService.ts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs.tsx";
import { DiscussionForumPage } from "../Discussion/DiscussionForumPage.tsx";
import { SolutionsPage } from "../Solution/SolutionsPage.tsx";

export function ProblemPage() {
    const { problemId, tab = "problem" } = useParams<{ problemId: string; tab?: string }>();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState(tab || "problem");
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchProblem() {
            if (!problemId) {
                setError(true);
                setLoading(false);
                return;
            }

            try {
                const problemData = await problemService.getProblem(problemId);
                if (problemData) {
                    setProblem(problemData);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Error fetching problem:", err);
                toast.error("Failed to load problem");
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchProblem();
    }, [problemId]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        navigate(`/problem/${problemId}/${value !== "problem" ? value : ""}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !problem) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Problem not found</h2>
                    <p className="text-gray-600 mt-2">The problem you're looking for doesn't exist or is unavailable.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-7xl mx-auto px-4 pt-4">
                <TabsList className="mb-4">
                    <TabsTrigger value="problem">Problem</TabsTrigger>
                    <TabsTrigger value="discussions">Discussions</TabsTrigger>
                    <TabsTrigger value="solutions">Solutions</TabsTrigger>
                </TabsList>

                <TabsContent value="problem">
                    <main className="flex-1 py-8 md:py-12 grid md:grid-cols-2 gap-8 md:gap-12">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                            <div className="prose prose-stone dark:prose-invert">
                                <ProblemStatement description={problem.description}/>
                            </div>
                        </div>
                        <ProblemSubmitBar problem={problem} />
                    </main>
                </TabsContent>

                <TabsContent value="discussions">
                    <DiscussionForumPage />
                </TabsContent>

                <TabsContent value="solutions">
                    <SolutionsPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}