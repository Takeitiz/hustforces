import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import problemService from "../../service/problemService";
import solutionService from "../../service/solutionService";
import { Problem } from "../../types/problem";
import { LANGUAGE_MAPPING } from "../../constants/languageMapping";
import MonacoEditor from "react-monaco-editor";
import { Button } from "../../components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { ArrowLeft, Code, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function CreateSolutionPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    const [problem, setProblem] = useState<Problem | null>(null);
    const [description, setDescription] = useState("");
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState(Object.keys(LANGUAGE_MAPPING)[0]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [isEditorReady, setIsEditorReady] = useState(false);

    useEffect(() => {
        if (!isLoggedIn) {
            toast.info("Please log in to create a solution");
            navigate("/login");
            return;
        }

        if (!slug) {
            toast.error("No problem specified");
            navigate(-1);
            return;
        }

        fetchProblem();
    }, [slug, isLoggedIn]);

    const fetchProblem = async () => {
        if (!slug) return;

        setLoading(true);
        try {
            const result = await problemService.getProblemBySlug(slug);
            if (result) {
                setProblem(result);

                // Set default code if available
                const defaultCodeForLanguage = result.defaultCode.find(
                    dc => dc.languageId === LANGUAGE_MAPPING[language]?.internal
                );
                if (defaultCodeForLanguage) {
                    setCode(defaultCodeForLanguage.code);
                }
            } else {
                toast.error("Problem not found");
                navigate(-1);
            }
        } catch (error) {
            console.error("Error fetching problem:", error);
            toast.error("Failed to load problem");
            navigate(-1);
        } finally {
            setLoading(false);
        }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description.trim() || !code.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        if (!problem) {
            toast.error("Problem not loaded");
            return;
        }

        setCreating(true);

        try {
            await solutionService.createSolution(code, description, problem.id, language);
            toast.success("Solution created successfully");
            navigate(`/problems/${slug}/solutions`);
        } catch (error) {
            console.error("Error creating solution:", error);
            toast.error("Failed to create solution");
        } finally {
            setCreating(false);
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Problem not found</p>
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="mt-4"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ArrowLeft size={18} className="mr-1" />
                        Back
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Code size={24} className="text-blue-600 dark:text-blue-400" />
                            <h1 className="text-2xl font-bold">Share Your Solution</h1>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                Creating solution for problem:
                            </p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                                {problem.title}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="language" className="block text-sm font-medium mb-2">
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
                                <label htmlFor="code" className="block text-sm font-medium mb-2">
                                    Solution Code
                                </label>
                                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className={`transition-opacity duration-300 ${isEditorReady ? "opacity-100" : "opacity-0"} relative z-10`}>
                                        <MonacoEditor
                                            height="400px"
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
                                <label htmlFor="description" className="block text-sm font-medium mb-2">
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

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
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
                                            Creating...
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
        </div>
    );
}