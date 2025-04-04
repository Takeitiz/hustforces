import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import solutionService from "../../service/solutionService";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Loader2, Code } from "lucide-react";
import { SolutionDetailDto } from "../../types/solution";
import { LANGUAGE_MAPPING } from "../../constants/languageMapping";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import MonacoEditor from "react-monaco-editor";
import { useAuth } from "../../contexts/AuthContext";

export function EditSolutionPage() {
    const { solutionId } = useParams<{ solutionId: string }>();
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [solution, setSolution] = useState<SolutionDetailDto | null>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchSolution = async () => {
            try {
                if (!solutionId) {
                    toast.error("Solution ID is missing");
                    navigate("/solutions");
                    return;
                }

                const data = await solutionService.getSolution(solutionId);
                setSolution(data);
                setCode(data.code);
                setDescription(data.description);

                // Find the language key based on internal value
                const languageKey = Object.keys(LANGUAGE_MAPPING).find(
                    key => LANGUAGE_MAPPING[key].internal === data.languageId
                ) || "";

                setLanguage(languageKey);

                // Check if the current user is the author
                if (user?.id !== data.user.id) {
                    toast.error("You can only edit your own solutions");
                    navigate(`/solutions/${solutionId}`);
                }
            } catch (error) {
                console.error("Error fetching solution:", error);
                toast.error("Failed to load solution");
                navigate("/solutions");
            } finally {
                setLoading(false);
            }
        };

        fetchSolution();
    }, [solutionId, navigate, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim() || !description.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmitting(true);

        try {
            await solutionService.updateSolution(solutionId!, code, description);
            toast.success("Solution updated successfully");
            navigate(`/solutions/${solutionId}`);
        } catch (error) {
            console.error("Error updating solution:", error);
            toast.error("Failed to update solution");
        } finally {
            setSubmitting(false);
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!solution) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Solution not found</p>
                    <Link to="/solutions" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Return to solutions
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link
                    to={`/solutions/${solutionId}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to solution
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Code size={20} className="text-blue-600 dark:text-blue-400" />
                        <h1 className="text-2xl font-bold">Edit Solution</h1>
                    </div>

                    {solution.problemId && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Solution for problem:
                            </p>
                            <Link
                                to={`/problem/${solution.problemId}`}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {solution.problemTitle}
                            </Link>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="language" className="block text-sm font-medium mb-1">
                                Programming Language
                            </label>
                            <div className="relative z-30">
                                <Select value={language} disabled={true}>
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    The programming language cannot be changed when editing a solution.
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="code" className="block text-sm font-medium mb-1">
                                Solution Code
                            </label>
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
                                        height="400px"
                                        language={LANGUAGE_MAPPING[language]?.monaco}
                                        theme="vs-dark"
                                        value={code}
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
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 min-h-[200px]"
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
                                onClick={() => navigate(`/solutions/${solutionId}`)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Solution"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}