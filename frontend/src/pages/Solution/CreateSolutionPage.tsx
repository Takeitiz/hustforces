import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import solutionService from "../../service/solutionService";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Loader2, Code } from "lucide-react";
import problemService from "../../service/problemService";
import { Problem } from "../../types/problem";
import { LANGUAGE_MAPPING } from "../../constants/languageMapping";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import MonacoEditor from "react-monaco-editor";

export function CreateSolutionPage() {
    const { problemId } = useParams<{ problemId: string }>();
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState(Object.keys(LANGUAGE_MAPPING)[0]);
    const [loading, setLoading] = useState(false);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loadingProblem, setLoadingProblem] = useState(true);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!problemId) {
            toast.error("Problem ID is required to create a solution");
            navigate("/problems");
            return;
        }

        const fetchProblem = async () => {
            try {
                const data = await problemService.getProblem(problemId);
                if (!data) {
                    toast.error("Problem not found");
                    navigate("/problems");
                    return;
                }
                setProblem(data);

                // If a default code exists for the selected language, use it
                const defaultCodeForLanguage = data.defaultCode.find(
                    dc => dc.languageId === LANGUAGE_MAPPING[language]?.internal
                );

                if (defaultCodeForLanguage) {
                    setCode(defaultCodeForLanguage.code);
                }
            } catch (error) {
                console.error("Error fetching problem:", error);
                toast.error("Failed to load problem information");
                navigate("/problems");
            } finally {
                setLoadingProblem(false);
            }
        };

        fetchProblem();
    }, [problemId, navigate, language]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !code.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            const result = await solutionService.createSolution(code, description, problemId!, language);
            toast.success("Solution created successfully");

            // Navigate to the new solution
            navigate(`/solutions/${result.id}`);
        } catch (error) {
            console.error("Error creating solution:", error);
            toast.error("Failed to create solution");
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (value: string) => {
        setLanguage(value);

        // If a default code exists for the selected language, use it
        if (problem) {
            const defaultCodeForLanguage = problem.defaultCode.find(
                dc => dc.languageId === LANGUAGE_MAPPING[value]?.internal
            );

            if (defaultCodeForLanguage) {
                setCode(defaultCodeForLanguage.code);
            } else {
                // Clear code if no default code exists for the selected language
                setCode("");
            }
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    if (loadingProblem) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link
                    to={`/problem/${problemId}/solutions`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to solutions
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Code size={20} className="text-blue-600 dark:text-blue-400" />
                        <h1 className="text-2xl font-bold">Share Your Solution</h1>
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
                                onClick={() => navigate(`/problem/${problemId}/solutions`)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2"
                            >
                                {loading ? (
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