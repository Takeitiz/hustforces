import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import solutionService from "../../service/solutionService";
import { SolutionDto } from "../../types/solution";
import { SolutionList } from "../../components/features/solution/SolutionList";
import { Button } from "../../components/ui/Button";
import { Plus, Search, ArrowLeft, Loader2, Code } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import problemService from "../../service/problemService";
import { Problem } from "../../types/problem";
import { LANGUAGE_MAPPING } from "../../constants/languageMapping";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import MonacoEditor from "react-monaco-editor";

interface SolutionsPageProps {
    problemSlug?: string;
    problemData?: Problem;
}

export function SolutionsPage({ problemSlug, problemData }: SolutionsPageProps = {}) {
    const { problemId, slug } = useParams<{ problemId?: string; slug?: string }>();
    const [solutions, setSolutions] = useState<SolutionDto[]>([]);
    const [problem, setProblem] = useState<Problem | null>(problemData || null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const { isLoggedIn } = useAuth();

    // Form state
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState(Object.keys(LANGUAGE_MAPPING)[0]);

    // Determine the effective slug and problemId
    const effectiveSlug = problemSlug || slug;
    const effectiveProblemId = problem?.id || problemId;

    useEffect(() => {
        fetchSolutions();
        if (!problemData && effectiveSlug) {
            fetchProblem();
        }
    }, [effectiveSlug, effectiveProblemId, problemData]);

    const fetchSolutions = async () => {
        setLoading(true);
        try {
            let result;
            if (effectiveProblemId) {
                result = await solutionService.getSolutionsByProblem(effectiveProblemId);
            } else {
                result = await solutionService.getAllSolutions();
            }
            setSolutions(result.content);
        } catch (error) {
            console.error("Error fetching solutions:", error);
            toast.error("Failed to load solutions");
        } finally {
            setLoading(false);
        }
    };

    const fetchProblem = async () => {
        if (!effectiveSlug) return;

        try {
            const result = await problemService.getProblemBySlug(effectiveSlug);
            if (result) {
                setProblem(result);

                // Set default code if available
                const defaultCodeForLanguage = result.defaultCode.find(
                    dc => dc.languageId === LANGUAGE_MAPPING[language]?.internal
                );
                if (defaultCodeForLanguage) {
                    setCode(defaultCodeForLanguage.code);
                }
            }
        } catch (error) {
            console.error("Error fetching problem:", error);
        }
    };

    const handleSearch = async () => {
        toast.info("Search functionality coming soon!");
    };

    const handleCreateSolution = () => {
        if (!isLoggedIn) {
            toast.info("Please log in to share a solution");
            return;
        }

        if (!effectiveProblemId) {
            toast.error("Cannot create solution without a problem context");
            return;
        }

        setShowCreateForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !code.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setCreating(true);

        try {
            await solutionService.createSolution(code, description, effectiveProblemId!, language);
            toast.success("Solution created successfully");

            // Reset form and refresh solutions
            setDescription("");
            setCode("");
            setShowCreateForm(false);
            fetchSolutions();
        } catch (error) {
            console.error("Error creating solution:", error);
            toast.error("Failed to create solution");
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setDescription("");
        setCode("");
    };

    const handleLanguageChange = (value: string) => {
        setLanguage(value);

        // Update default code if available
        if (problem) {
            const defaultCodeForLanguage = problem.defaultCode.find(
                dc => dc.languageId === LANGUAGE_MAPPING[value]?.internal
            );
            if (defaultCodeForLanguage) {
                setCode(defaultCodeForLanguage.code);
            } else {
                setCode("");
            }
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    if (showCreateForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center mb-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ArrowLeft size={18} className="mr-1" />
                        Back to solutions
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Code size={20} className="text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-bold">Share Your Solution</h2>
                        </div>

                        {problem && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Creating solution for problem:
                                </p>
                                <p className="font-medium text-blue-600 dark:text-blue-400">
                                    {problem.title}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor="language" className="block text-sm font-medium mb-1">
                                    Programming Language
                                </label>
                                <div className="relative z-30">
                                    <Select value={language} onValueChange={handleLanguageChange}>
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

                            <div className="mb-6">
                                <label htmlFor="code" className="block text-sm font-medium mb-1">
                                    Solution Code
                                </label>
                                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className={`transition-opacity duration-300 ${isEditorReady ? "opacity-100" : "opacity-0"} relative z-10`}>
                                        <MonacoEditor
                                            height="300px"
                                            language={LANGUAGE_MAPPING[language]?.monaco}
                                            theme="vs-dark"
                                            value={code}
                                            options={{
                                                fontSize: 14,
                                                scrollBeyondLastLine: false,
                                                minimap: { enabled: false },
                                                lineNumbers: "on",
                                                wordWrap: "on",
                                                automaticLayout: true,
                                            }}
                                            onChange={(value) => setCode(value || "")}
                                            editorDidMount={handleEditorDidMount}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="description" className="block text-sm font-medium mb-1">
                                    Explanation
                                </label>
                                <textarea
                                    id="description"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 min-h-[150px]"
                                    placeholder="Explain your solution approach. What's the time complexity? Any optimizations or edge cases?"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Pro tip: You can use Markdown syntax for formatting.
                                </p>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mr-2"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creating}
                                    className="flex items-center gap-2"
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sharing...
                                        </>
                                    ) : (
                                        "Share Solution"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    {problem
                        ? `Solutions for ${problem.title}`
                        : (effectiveProblemId ? "Problem Solutions" : "All Solutions")}
                </h2>

                {effectiveProblemId && (
                    <Button
                        className="flex items-center gap-2"
                        onClick={handleCreateSolution}
                        size="sm"
                    >
                        <Plus size={16} />
                        Share Solution
                    </Button>
                )}
            </div>

            {problem && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 text-sm">
                    <p className="text-gray-600 dark:text-gray-300">
                        Browse user-submitted solutions or share your own approach.
                    </p>
                </div>
            )}

            <div className="flex gap-4 mb-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                        placeholder="Search solutions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <Button onClick={handleSearch} size="sm">Search</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <SolutionList
                    solutions={solutions}
                    onSolutionUpdate={fetchSolutions}
                />
            )}
        </div>
    );
}