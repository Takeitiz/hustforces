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
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GripVertical, ChevronLeft, PlayCircle, Clock, Users } from "lucide-react";
import { Button } from "../../components/ui/Button.tsx";
import { Logo } from "../../components/ui/Logo.tsx";
import Submissions from "../../components/features/problem/Submissions.tsx";
import submissionService from "../../service/submissionService.ts";
import { useAuth } from "../../contexts/AuthContext.tsx";

// Custom AppBar for Problem Page
const ProblemAppBar: React.FC<{
    problem: Problem;
    onSubmit: () => void;
    submitting: boolean;
}> = ({ problem, onSubmit, submitting }) => {
    const navigate = useNavigate();

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between h-16 px-4">
                {/* Left Section - Logo and Back Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/problems")}
                        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Problem List</span>
                    </button>
                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                    <Logo size="small" />
                </div>

                {/* Center Section - Problem Title and Submit Button */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {problem.title}
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                problem.difficulty === "EASY" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                    problem.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}>
                                {problem.difficulty}
                            </span>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{problem.timeLimit || 1}s</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{problem.solved} solved</span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 flex items-center gap-2"
                    >
                        <PlayCircle className="w-4 h-4" />
                        {submitting ? "Submitting..." : "Submit"}
                    </Button>
                </div>

                {/* Right Section - User Actions */}
                <div className="flex items-center gap-4">
                    {/* Add any additional actions here if needed */}
                </div>
            </div>
        </div>
    );
};

export function ProblemPage() {
    const { slug } = useParams<{ slug: string }>();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState("problem");
    const [submitting, setSubmitting] = useState(false);
    const [currentCode, setCurrentCode] = useState<string>("");
    const [currentLanguage, setCurrentLanguage] = useState<string>("cpp");
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        async function fetchProblem() {
            if (!slug) {
                setError(true);
                setLoading(false);
                return;
            }

            try {
                const problemData = await problemService.getProblemBySlug(slug);
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
    }, [slug]);

    // Handle submit from the AppBar
    const handleSubmit = async () => {
        if (!isLoggedIn) {
            navigate("/login");
            toast.info("Please log in to submit solutions");
            return;
        }

        if (!currentCode) {
            toast.error("Please write some code before submitting");
            return;
        }

        setSubmitting(true);
        try {
            await submissionService.submitCode({
                code: currentCode,
                languageId: currentLanguage,
                problemId: problem!.id,
            });

            // Poll for results (you can implement this based on your existing logic)
            toast.success("Solution submitted successfully!");
            // Switch to submissions tab to see the result
            setActiveTab("submissions");
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Submission failed";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Callback to receive code and language from child component
    const handleCodeChange = (code: string, language: string) => {
        setCurrentCode(code);
        setCurrentLanguage(language);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Custom AppBar */}
            <ProblemAppBar
                problem={problem}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            {/* Main Content */}
            <main className="pt-16 h-screen">
                <PanelGroup
                    direction="horizontal"
                    className="h-full"
                    autoSaveId="problem-page-panels"
                >
                    {/* Left Panel - Problem Description with Tabs */}
                    <Panel
                        defaultSize={50}
                        minSize={30}
                        className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
                    >
                        <div className="h-full flex flex-col">
                            {/* Tabs Header */}
                            <div className="border-b border-gray-200 dark:border-gray-700 px-4 pt-4">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid grid-cols-4 w-full">
                                        <TabsTrigger value="problem">Problem</TabsTrigger>
                                        <TabsTrigger value="solutions">Solutions</TabsTrigger>
                                        <TabsTrigger value="discussions">Discussions</TabsTrigger>
                                        <TabsTrigger value="submissions">Submissions</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsContent value="problem" className="mt-0">
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <ProblemStatement problem={problem}/>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="solutions" className="mt-0">
                                        <SolutionsPage />
                                    </TabsContent>

                                    <TabsContent value="discussions" className="mt-0">
                                        <DiscussionForumPage />
                                    </TabsContent>

                                    <TabsContent value="submissions" className="mt-0">
                                        <Submissions problem={problem} />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </Panel>

                    {/* Resize Handle */}
                    <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-200 relative group">
                        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500/20 transition-colors duration-200" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 rounded bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-500 dark:group-hover:bg-blue-600 transition-colors duration-200">
                            <GripVertical className="w-3 h-3 text-gray-600 dark:text-gray-300 group-hover:text-white" />
                        </div>
                    </PanelResizeHandle>

                    {/* Right Panel - Code Editor */}
                    <Panel
                        defaultSize={50}
                        minSize={30}
                        className="bg-gray-50 dark:bg-gray-900"
                    >
                        <div className="h-full">
                            <ProblemSubmitBar
                                problem={problem}
                                onCodeChange={handleCodeChange}
                                hideSubmitButton={true}
                            />
                        </div>
                    </Panel>
                </PanelGroup>
            </main>
        </div>
    );
}