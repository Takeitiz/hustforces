import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import solutionService from "../../../service/solutionService";
import commentService from "../../../service/commentService";
import { SolutionDetailDto } from "../../../types/solution";
import { CommentForm } from "../comment/CommentForm";
import { CommentList } from "../comment/CommentList";
import { User, ThumbsUp, ThumbsDown, ArrowLeft, Trash, Code, Loader2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { useAuth } from "../../../contexts/AuthContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getLanguageName } from "../../../constants/languageMapping";
import MonacoEditor from "react-monaco-editor";
import { LANGUAGE_MAPPING } from "../../../constants/languageMapping";

interface SolutionDetailViewProps {
    solutionId: string;
    onBack: () => void;
    onUpdate?: () => void;
}

export function SolutionDetailView({ solutionId, onBack, onUpdate }: SolutionDetailViewProps) {
    const [solution, setSolution] = useState<SolutionDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        fetchSolution();
    }, [solutionId]);

    const fetchSolution = async () => {
        setLoading(true);
        try {
            const data = await solutionService.getSolution(solutionId);
            setSolution(data);
        } catch (error) {
            console.error("Error fetching solution:", error);
            toast.error("Failed to load solution");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (isUpvote: boolean) => {
        if (!isLoggedIn) {
            toast.info("Please log in to vote");
            return;
        }

        if (voting) return;

        setVoting(true);
        try {
            const updatedSolution = await solutionService.voteSolution(solutionId, isUpvote);
            setSolution(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    upvotes: updatedSolution.upvotes,
                    downvotes: updatedSolution.downvotes
                };
            });
            toast.success(isUpvote ? "Upvoted solution" : "Downvoted solution");
        } catch (error) {
            console.error("Error voting on solution:", error);
            toast.error("Failed to vote on solution");
        } finally {
            setVoting(false);
        }
    };

    const handleCommentSubmit = async (content: string) => {
        if (!isLoggedIn) {
            toast.info("Please log in to comment");
            return;
        }

        try {
            await commentService.createComment(content, null, solutionId);
            toast.success("Comment posted successfully");
            fetchSolution(); // Refresh to get the new comment
        } catch (error) {
            console.error("Error posting comment:", error);
            toast.error("Failed to post comment");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this solution?")) {
            return;
        }

        try {
            await solutionService.deleteSolution(solutionId);
            toast.success("Solution deleted successfully");
            onBack();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error deleting solution:", error);
            toast.error("Failed to delete solution");
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    const canEditSolution = isLoggedIn && solution?.user.id === user?.id;

    // Find the language key from the languageId
    const getLanguageKey = (languageId: number): string => {
        return Object.keys(LANGUAGE_MAPPING).find(
            key => LANGUAGE_MAPPING[key].internal === languageId
        ) || 'javascript';
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    if (!solution) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Solution not found</p>
                <button
                    onClick={onBack}
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
                >
                    Return to solutions
                </button>
            </div>
        );
    }

    const languageKey = getLanguageKey(parseInt(String(solution.languageId)));

    return (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to solutions
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Code size={20} className="text-blue-600 dark:text-blue-400" />
                            <h1 className="text-2xl font-bold">
                                Solution by {solution.user.username}
                            </h1>
                            <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300 text-sm">
                                {getLanguageName(parseInt(String(solution.languageId)))}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(true)}
                                disabled={voting}
                            >
                                <ThumbsUp size={16} />
                                <span>{solution.upvotes}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(false)}
                                disabled={voting}
                            >
                                <ThumbsDown size={16} />
                                <span>{solution.downvotes}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center mb-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                            {solution.user.profilePicture ? (
                                <img
                                    src={solution.user.profilePicture}
                                    alt={solution.user.username}
                                    className="w-6 h-6 rounded-full mr-2"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-2">
                                    <User size={14} />
                                </div>
                            )}
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {solution.user.username}
                            </span>
                        </div>

                        <span className="mx-2">•</span>
                        <span>
                            {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
                        </span>

                        {solution.problemTitle && (
                            <>
                                <span className="mx-2">•</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                    {solution.problemTitle}
                                </span>
                            </>
                        )}
                    </div>

                    {canEditSolution && (
                        <div className="flex justify-end mb-4">
                            <button
                                className="flex items-center text-red-600 dark:text-red-400 hover:underline"
                                onClick={handleDelete}
                            >
                                <Trash size={16} className="mr-1" />
                                Delete
                            </button>
                        </div>
                    )}

                    <div className="prose prose-blue dark:prose-invert max-w-none mb-6">
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {solution.description}
                        </Markdown>
                    </div>

                    <div className="mt-6 mb-6">
                        <h2 className="text-lg font-semibold mb-3">Solution Code</h2>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className={`transition-opacity duration-300 ${isEditorReady ? "opacity-100" : "opacity-0"} relative z-10`}>
                                <MonacoEditor
                                    height="400px"
                                    language={LANGUAGE_MAPPING[languageKey]?.monaco}
                                    theme="vs-dark"
                                    value={solution.code}
                                    options={{
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                        minimap: { enabled: true },
                                        lineNumbers: "on",
                                        wordWrap: "on",
                                        automaticLayout: true,
                                        readOnly: true
                                    }}
                                    editorDidMount={handleEditorDidMount}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Comments</h2>

                <CommentForm onSubmit={handleCommentSubmit} />

                <div className="mt-6">
                    <CommentList comments={solution.comments} />
                </div>
            </div>
        </div>
    );
}