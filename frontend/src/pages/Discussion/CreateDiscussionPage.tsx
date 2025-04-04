import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import discussionService from "../../service/discussionService";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import problemService from "../../service/problemService";
import { Problem } from "../../types/problem";

export function CreateDiscussionPage() {
    const { problemId } = useParams<{ problemId?: string }>();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loadingProblem, setLoadingProblem] = useState(problemId ? true : false);
    const navigate = useNavigate();

    useEffect(() => {
        if (problemId) {
            const fetchProblem = async () => {
                try {
                    const data = await problemService.getProblem(problemId);
                    setProblem(data);
                } catch (error) {
                    console.error("Error fetching problem:", error);
                    toast.error("Failed to load problem information");
                } finally {
                    setLoadingProblem(false);
                }
            };

            fetchProblem();
        }
    }, [problemId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            const result = await discussionService.createDiscussion(title, content, problemId);
            toast.success("Discussion created successfully");

            // Navigate to the new discussion
            navigate(`/discussions/${result.id}`);
        } catch (error) {
            console.error("Error creating discussion:", error);
            toast.error("Failed to create discussion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link
                    to={problemId ? `/problem/${problemId}/discussions` : "/discussions"}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to discussions
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Create New Discussion</h1>

                    {problemId && (
                        loadingProblem ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 flex items-center">
                                <Loader2 className="animate-spin mr-2" size={18} />
                                <p>Loading problem information...</p>
                            </div>
                        ) : problem ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Creating discussion for problem:
                                </p>
                                <p className="font-medium text-blue-600 dark:text-blue-400">
                                    {problem.title}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 text-red-600 dark:text-red-400">
                                Problem not found. The discussion will be created without a problem reference.
                            </div>
                        )
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700"
                                placeholder="Enter a descriptive title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="content" className="block text-sm font-medium mb-1">
                                Content
                            </label>
                            <textarea
                                id="content"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 min-h-[300px]"
                                placeholder="Markdown is supported. Describe your question or discussion topic in detail."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
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
                                onClick={() => navigate(-1)}
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
                                        Creating...
                                    </>
                                ) : (
                                    "Create Discussion"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}