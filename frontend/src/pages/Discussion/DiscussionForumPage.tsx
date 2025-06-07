import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import discussionService from "../../service/discussionService";
import { DiscussionDto } from "../../types/discussion";
import { Button } from "../../components/ui/Button";
import { DiscussionList } from "../../components/features/discussion/DiscussionList";
import { Plus, Search, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import problemService from "../../service/problemService";
import { Problem } from "../../types/problem";

interface DiscussionForumPageProps {
    problemSlug?: string;
    problemData?: Problem;
}

export function DiscussionForumPage({ problemSlug, problemData }: DiscussionForumPageProps = {}) {
    const { problemId, slug } = useParams<{ problemId?: string; slug?: string }>();
    const [discussions, setDiscussions] = useState<DiscussionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [problem, setProblem] = useState<Problem | null>(problemData || null);
    const { isLoggedIn } = useAuth();

    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // Determine the effective slug and problemId
    const effectiveSlug = problemSlug || slug;
    const effectiveProblemId = problem?.id || problemId;

    useEffect(() => {
        fetchDiscussions();
        if (!problemData && effectiveSlug) {
            fetchProblem();
        }
    }, [effectiveSlug, effectiveProblemId, problemData]);

    const fetchProblem = async () => {
        if (!effectiveSlug) return;

        try {
            const data = await problemService.getProblemBySlug(effectiveSlug);
            if (data) {
                setProblem(data);
            }
        } catch (error) {
            console.error("Error fetching problem:", error);
        }
    };

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            let result;
            if (effectiveProblemId) {
                result = await discussionService.getDiscussionsByProblem(effectiveProblemId);
            } else {
                result = await discussionService.getAllDiscussions();
            }
            setDiscussions(result.content);
        } catch (error) {
            console.error("Error fetching discussions:", error);
            toast.error("Failed to load discussions");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchDiscussions();
            return;
        }

        setLoading(true);
        try {
            const result = await discussionService.searchDiscussions(searchQuery);
            setDiscussions(result.content);
        } catch (error) {
            console.error("Error searching discussions:", error);
            toast.error("Failed to search discussions");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDiscussion = () => {
        if (!isLoggedIn) {
            toast.info("Please log in to create a discussion");
            return;
        }
        setShowCreateForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setCreating(true);

        try {
            await discussionService.createDiscussion(title, content, effectiveProblemId);
            toast.success("Discussion created successfully");

            // Reset form and refresh discussions
            setTitle("");
            setContent("");
            setShowCreateForm(false);
            fetchDiscussions();
        } catch (error) {
            console.error("Error creating discussion:", error);
            toast.error("Failed to create discussion");
        } finally {
            setCreating(false);
        }
    };

    const handleCancel = () => {
        setShowCreateForm(false);
        setTitle("");
        setContent("");
    };

    if (showCreateForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center mb-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ArrowLeft size={18} className="mr-1" />
                        Back to discussions
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Create New Discussion</h2>

                        {problem && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Creating discussion for problem:
                                </p>
                                <p className="font-medium text-blue-600 dark:text-blue-400">
                                    {problem.title}
                                </p>
                            </div>
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700 min-h-[200px]"
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

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                    {effectiveProblemId ? "Problem Discussions" : "Discussion Forum"}
                </h2>
                <Button
                    className="flex items-center gap-2"
                    onClick={handleCreateDiscussion}
                    size="sm"
                >
                    <Plus size={16} />
                    Start Discussion
                </Button>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                        placeholder="Search discussions..."
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
                <DiscussionList
                    discussions={discussions}
                    onDiscussionUpdate={fetchDiscussions}
                />
            )}
        </div>
    );
}