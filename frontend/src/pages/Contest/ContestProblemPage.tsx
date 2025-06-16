import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
    GripVertical,
    ChevronLeft,
    ChevronRight,
    PlayCircle,
    Clock,
    Trophy,
    ListOrdered
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { ProblemStatement } from "../../components/features/problem/ProblemStatement";
import { ProblemSubmitBar } from "../../components/features/problem/ProblemSubmitBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import Submissions from "../../components/features/problem/Submissions";
import { useAuth } from "../../contexts/AuthContext";
import contestService from "../../service/contestService";
import problemService from "../../service/problemService";
import submissionService from "../../service/submissionService";
import { ContestDetailDto } from "../../types/contest";
import { Problem } from "../../types/problem";

// Custom AppBar for Contest Problem Page
const ContestProblemAppBar: React.FC<{
    contest: ContestDetailDto;
    problem: Problem;
    currentProblemIndex: number;
    onSubmit: () => void;
    submitting: boolean;
    onNavigateProblem: (index: number) => void;
}> = ({ contest, problem, currentProblemIndex, onSubmit, submitting, onNavigateProblem }) => {
    const navigate = useNavigate();

    const hasPreviousProblem = currentProblemIndex > 0;
    const hasNextProblem = currentProblemIndex < contest.problems.length - 1;

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="h-20">
                {/* Top Row - Contest Name */}
                <div className="h-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Trophy className="w-3 h-3 text-indigo-500" />
                        <span className="font-medium">{contest.title}</span>
                        <span className="text-gray-400 dark:text-gray-500">•</span>
                        <span>Problem {currentProblemIndex + 1} of {contest.problems.length}</span>
                    </div>
                </div>

                {/* Bottom Row - Main Navigation */}
                <div className="h-12 grid grid-cols-3 items-center px-4">
                    {/* Left Section - Back to Contest and Logo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/contests/${contest.id}`)}
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">Contest</span>
                        </button>
                        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                        <Logo size="small" />
                    </div>

                    {/* Center Section - Problem Info, Navigation, and Submit */}
                    <div className="flex items-center justify-center gap-3">
                        {/* Previous Problem */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateProblem(currentProblemIndex - 1)}
                            disabled={!hasPreviousProblem}
                            className="p-1.5"
                            aria-label="Previous problem"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Problem Info */}
                        <div className="text-center px-4">
                            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                                {String.fromCharCode(65 + currentProblemIndex)}. {problem.title}
                            </h1>
                            <div className="flex items-center justify-center gap-3 mt-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    problem.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                        problem.difficulty === "MEDIUM" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                    {problem.difficulty}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{problem.timeLimit || 1}s</span>
                                </div>
                            </div>
                        </div>

                        {/* Next Problem */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateProblem(currentProblemIndex + 1)}
                            disabled={!hasNextProblem}
                            className="p-1.5"
                            aria-label="Next problem"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        {/* Submit Button */}
                        <div className="ml-4">
                            <Button
                                onClick={onSubmit}
                                disabled={submitting}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-1.5 text-sm flex items-center gap-2"
                            >
                                <PlayCircle className="w-4 h-4" />
                                {submitting ? "Submitting..." : "Submit"}
                            </Button>
                        </div>
                    </div>

                    {/* Right Section - Problem List */}
                    <div className="flex items-center justify-end">
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <ListOrdered className="w-4 h-4" />
                                <span className="text-sm">Problems</span>
                            </button>

                            {/* Dropdown */}
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="p-2 max-h-64 overflow-y-auto">
                                    {contest.problems.map((p, index) => (
                                        <button
                                            key={p.id}
                                            onClick={() => onNavigateProblem(index)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                                index === currentProblemIndex
                                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">
                                                    {String.fromCharCode(65 + index)}. {p.title}
                                                </span>
                                                {p.solved > 0 && (
                                                    <span className="text-xs text-gray-500">
                                                        {p.solved} solved
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export function ContestProblemPage() {
    const { contestId, problemIndex } = useParams<{ contestId: string; problemIndex: string }>();
    const [contest, setContest] = useState<ContestDetailDto | null>(null);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [activeTab, setActiveTab] = useState("problem");
    const [submitting, setSubmitting] = useState(false);
    const [currentCode, setCurrentCode] = useState<string>("");
    const [currentLanguage, setCurrentLanguage] = useState<string>("cpp");
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const currentProblemIndex = parseInt(problemIndex || "0");

    useEffect(() => {
        if (contestId) {
            fetchContestAndProblem();
        }
    }, [contestId, problemIndex]);

    const fetchContestAndProblem = async () => {
        if (!contestId) {
            setError(true);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Fetch contest details
            const contestData = await contestService.getContest(contestId);
            setContest(contestData);

            // Check if problem index is valid
            if (currentProblemIndex >= 0 && currentProblemIndex < contestData.problems.length) {
                const contestProblem = contestData.problems[currentProblemIndex];
                // Use title as slug - convert to lowercase and replace spaces with hyphens
                const problemSlug = contestProblem.title.toLowerCase().replace(/\s+/g, '-');

                const problemData = await problemService.getProblemBySlug(
                    problemSlug,
                    contestId
                );

                if (problemData) {
                    setProblem(problemData);
                } else {
                    setError(true);
                }
            } else {
                setError(true);
            }
        } catch (err) {
            console.error("Error fetching contest or problem:", err);
            toast.error("Failed to load contest problem");
            setError(true);
        } finally {
            setLoading(false);
        }
    };

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

        if (!problem || !contestId) return;

        setSubmitting(true);
        try {
            await submissionService.submitCode({
                code: currentCode,
                languageId: currentLanguage,
                problemId: problem.id,
                activeContestId: contestId, // Pass the contest ID here
            });

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

    const handleCodeChange = (code: string, language: string) => {
        setCurrentCode(code);
        setCurrentLanguage(language);
    };

    const handleNavigateProblem = (newIndex: number) => {
        if (newIndex >= 0 && newIndex < (contest?.problems.length || 0)) {
            navigate(`/contests/${contestId}/problem/${newIndex}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !contest || !problem) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Problem not found</h2>
                    <p className="text-gray-600 mt-2">The contest problem you're looking for doesn't exist or is unavailable.</p>
                    <Link
                        to={`/contests/${contestId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
                    >
                        Return to contest
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Custom AppBar */}
            <ContestProblemAppBar
                contest={contest}
                problem={problem}
                currentProblemIndex={currentProblemIndex}
                onSubmit={handleSubmit}
                submitting={submitting}
                onNavigateProblem={handleNavigateProblem}
            />

            {/* Main Content */}
            <main className="pt-16 h-screen">
                <PanelGroup
                    direction="horizontal"
                    className="h-full"
                    autoSaveId="contest-problem-panels"
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
                                    <TabsList className="grid grid-cols-2 w-full max-w-md">
                                        <TabsTrigger value="problem">Problem</TabsTrigger>
                                        <TabsTrigger value="submissions">Submissions</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsContent value="problem" className="mt-0">
                                        <div className="prose prose-stone dark:prose-invert max-w-none">
                                            <ProblemStatement problem={problem} />
                                        </div>
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
                                contestId={contestId}
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