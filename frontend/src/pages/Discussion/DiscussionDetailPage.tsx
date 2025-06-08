import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import discussionService from "../../service/discussionService";
import commentService from "../../service/commentService";
import { DiscussionDetailDto, CommentDto } from "../../types/discussion";
import { CommentForm } from "../../components/features/comment/CommentForm";
import { CommentList } from "../../components/features/comment/CommentList";
import { User, ThumbsUp, ThumbsDown, ArrowLeft, Edit, Trash } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function DiscussionDetailPage() {
    const { discussionId } = useParams<{ discussionId: string }>();
    const [discussion, setDiscussion] = useState<DiscussionDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        if (discussionId) {
            fetchDiscussion();
        }
    }, [discussionId]);

    const fetchDiscussion = async () => {
        setLoading(true);
        try {
            const data = await discussionService.getDiscussion(discussionId!);
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

        try {
            const updatedDiscussion = await discussionService.voteDiscussion(discussionId!, isUpvote);
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
        }
    };

    const handleCommentSubmit = async (content: string) => {
        if (!isLoggedIn) {
            toast.info("Please log in to comment");
            return;
        }

        try {
            const newComment = await commentService.createComment(content, discussionId!);
            toast.success("Comment posted successfully");

            // Add the new comment to the discussion
            setDiscussion(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    comments: [...prev.comments, newComment]
                };
            });
        } catch (error) {
            console.error("Error posting comment:", error);
            toast.error("Failed to post comment");
        }
    };

    const handleCommentUpdate = (commentId: string, updatedData: Partial<CommentDto>) => {
        setDiscussion(prev => {
            if (!prev) return null;

            const updateCommentRecursively = (comments: CommentDto[]): CommentDto[] => {
                return comments.map(comment => {
                    if (comment.id === commentId) {
                        return { ...comment, ...updatedData };
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        return {
                            ...comment,
                            replies: updateCommentRecursively(comment.replies)
                        };
                    }
                    return comment;
                });
            };

            return {
                ...prev,
                comments: updateCommentRecursively(prev.comments)
            };
        });
    };

    const handleCommentDelete = (commentId: string) => {
        setDiscussion(prev => {
            if (!prev) return null;

            const deleteCommentRecursively = (comments: CommentDto[]): CommentDto[] => {
                return comments.filter(comment => {
                    if (comment.id === commentId) {
                        return false;
                    }
                    if (comment.replies && comment.replies.length > 0) {
                        comment.replies = deleteCommentRecursively(comment.replies);
                    }
                    return true;
                });
            };

            return {
                ...prev,
                comments: deleteCommentRecursively(prev.comments)
            };
        });
    };

    const canEditDiscussion = isLoggedIn && discussion?.user.id === user?.id;

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Discussion not found</p>
                    <Link to="/discussions" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Return to discussions
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link
                    to={discussion.problemId ? `/problem/${discussion.problemId}/discussions` : "/discussions"}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to discussions
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {discussion.title}
                        </h1>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(true)}
                            >
                                <ThumbsUp size={16} />
                                <span>{discussion.upvotes}</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => handleVote(false)}
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
                                <Link
                                    to={`/problem/${discussion.problemId}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {discussion.problemTitle}
                                </Link>
                            </>
                        )}
                    </div>

                    {canEditDiscussion && (
                        <div className="flex justify-end mb-4">
                            <Link
                                to={`/discussions/${discussion.id}/edit`}
                                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mr-4"
                            >
                                <Edit size={16} className="mr-1" />
                                Edit
                            </Link>

                            <button
                                className="flex items-center text-red-600 dark:text-red-400 hover:underline"
                                onClick={() => {
                                    // Implement delete discussion functionality
                                }}
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

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Comments</h2>

                <CommentForm onSubmit={handleCommentSubmit} />

                <div className="mt-6">
                    <CommentList
                        comments={discussion.comments}
                        onCommentUpdate={handleCommentUpdate}
                        onCommentDelete={handleCommentDelete}
                    />
                </div>
            </div>
        </div>
    );
}