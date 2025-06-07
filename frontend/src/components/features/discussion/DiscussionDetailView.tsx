import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import discussionService from "../../../service/discussionService";
import commentService from "../../../service/commentService";
import { DiscussionDetailDto } from "../../../types/discussion";
import { CommentForm } from "../comment/CommentForm";
import { CommentList } from "../comment/CommentList";
import { User, ThumbsUp, ThumbsDown, ArrowLeft, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { useAuth } from "../../../contexts/AuthContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DiscussionDetailViewProps {
    discussionId: string;
    onBack: () => void;
    onUpdate?: () => void;
}

export function DiscussionDetailView({ discussionId, onBack, onUpdate }: DiscussionDetailViewProps) {
    const [discussion, setDiscussion] = useState<DiscussionDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        fetchDiscussion();
    }, [discussionId]);

    const fetchDiscussion = async () => {
        setLoading(true);
        try {
            const data = await discussionService.getDiscussion(discussionId);
            setDiscussion(data);
        } catch (error) {
            console.error("Error fetching discussion:", error);
            toast.error("Failed to load discussion");
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
            const updatedDiscussion = await discussionService.voteDiscussion(discussionId, isUpvote);
            setDiscussion(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    upvotes: updatedDiscussion.upvotes,
                    downvotes: updatedDiscussion.downvotes
                };
            });
            toast.success(isUpvote ? "Upvoted discussion" : "Downvoted discussion");
        } catch (error) {
            console.error("Error voting on discussion:", error);
            toast.error("Failed to vote on discussion");
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
            await commentService.createComment(content, discussionId);
            toast.success("Comment posted successfully");
            fetchDiscussion(); // Refresh to get the new comment
        } catch (error) {
            console.error("Error posting comment:", error);
            toast.error("Failed to post comment");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this discussion?")) {
            return;
        }

        try {
            await discussionService.deleteDiscussion(discussionId);
            toast.success("Discussion deleted successfully");
            onBack();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error deleting discussion:", error);
            toast.error("Failed to delete discussion");
        }
    };

    const canEditDiscussion = isLoggedIn && discussion?.user.id === user?.id;

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Discussion not found</p>
                <button
                    onClick={onBack}
                    className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
                >
                    Return to discussions
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to discussions
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex-1">
                            {discussion.title}
                        </h1>

                        <div className="flex items-center gap-2 ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(true)}
                                disabled={voting}
                            >
                                <ThumbsUp size={16} />
                                <span>{discussion.upvotes}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(false)}
                                disabled={voting}
                            >
                                <ThumbsDown size={16} />
                                <span>{discussion.downvotes}</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center mb-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                            {discussion.user.profilePicture ? (
                                <img
                                    src={discussion.user.profilePicture}
                                    alt={discussion.user.username}
                                    className="w-6 h-6 rounded-full mr-2"
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-2">
                                    <User size={14} />
                                </div>
                            )}
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {discussion.user.username}
                            </span>
                        </div>

                        <span className="mx-2">•</span>
                        <span>
                            {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                        </span>

                        {discussion.problemTitle && (
                            <>
                                <span className="mx-2">•</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                    {discussion.problemTitle}
                                </span>
                            </>
                        )}
                    </div>

                    {canEditDiscussion && (
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

                    <div className="prose prose-blue dark:prose-invert max-w-none">
                        <Markdown remarkPlugins={[remarkGfm]}>
                            {discussion.content}
                        </Markdown>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Comments</h2>

                <CommentForm onSubmit={handleCommentSubmit} />

                <div className="mt-6">
                    <CommentList comments={discussion.comments} />
                </div>
            </div>
        </div>
    );
}