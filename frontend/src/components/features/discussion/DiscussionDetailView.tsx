import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { User, ThumbsUp, ThumbsDown, ArrowLeft, Edit, Trash, X, Save, Loader2, Eye, FileText } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import discussionService from "../../../service/discussionService.ts";
import commentService from "../../../service/commentService.ts";
import {CommentDto, DiscussionDetailDto} from "../../../types/discussion.ts";
import {CommentList} from "../comment/CommentList.tsx";
import {CommentForm} from "../comment/CommentForm.tsx";
import {Modal} from "../../ui/Modal.tsx";
import {Button} from "../../ui/Button.tsx";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "../../ui/Tabs.tsx";
import {useAuth} from "../../../contexts/AuthContext.tsx";

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

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingContent, setEditingContent] = useState("");
    const [saving, setSaving] = useState(false);
    const [editTab, setEditTab] = useState<"edit" | "preview">("edit");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (discussionId) {
            fetchDiscussion();
        }
    }, [discussionId]);

    const fetchDiscussion = async () => {
        setLoading(true);
        try {
            const data = await discussionService.getDiscussion(discussionId);
            setDiscussion(data);
            // Initialize editing states
            setEditingTitle(data.title);
            setEditingContent(data.content);
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
            setDiscussion((prev: any) => {
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
            const newComment = await commentService.createComment(content, discussionId);
            toast.success("Comment posted successfully");

            // Add the new comment to the discussion
            setDiscussion((prev) => {
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

    const handleEdit = () => {
        setIsEditMode(true);
        setEditTab("edit"); // Reset to edit tab when entering edit mode
    };

    const handleCancelEdit = () => {
        // Reset to original values
        if (discussion) {
            setEditingTitle(discussion.title);
            setEditingContent(discussion.content);
        }
        setIsEditMode(false);
    };

    const handleSaveEdit = async () => {
        if (!editingTitle.trim() || !editingContent.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSaving(true);
        try {
            await discussionService.updateDiscussion(discussionId, editingTitle, editingContent);
            toast.success("Discussion updated successfully");

            // Update local state with new values
            if (discussion) {
                setDiscussion({
                    ...discussion,
                    title: editingTitle,
                    content: editingContent
                });
            }

            setIsEditMode(false);
        } catch (error) {
            console.error("Error updating discussion:", error);
            toast.error("Failed to update discussion");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await discussionService.deleteDiscussion(discussionId);
            toast.success("Discussion deleted successfully");
            setShowDeleteModal(false);

            // Navigate back and update the list
            onBack();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error deleting discussion:", error);
            toast.error("Failed to delete discussion");
        }
    };

    const handleCommentUpdate = (commentId: string, updatedData: Partial<CommentDto>) => {
        setDiscussion((prev) => {
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
        setDiscussion((prev) => {
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
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
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
                    {/* Title Section - Editable */}
                    {isEditMode ? (
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-700"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                placeholder="Enter discussion title"
                            />
                        </div>
                    ) : (
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">
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
                    )}

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
                            {isEditMode ? (
                                <>
                                    <button
                                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mr-4"
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                    >
                                        <X size={16} className="mr-1" />
                                        Cancel
                                    </button>
                                    <button
                                        className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 mr-4"
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <Loader2 size={16} className="mr-1 animate-spin" />
                                        ) : (
                                            <Save size={16} className="mr-1" />
                                        )}
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mr-4"
                                        onClick={handleEdit}
                                    >
                                        <Edit size={16} className="mr-1" />
                                        Edit
                                    </button>

                                    <button
                                        className="flex items-center text-red-600 dark:text-red-400 hover:underline"
                                        onClick={() => setShowDeleteModal(true)}
                                    >
                                        <Trash size={16} className="mr-1" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Content Section */}
                    {isEditMode ? (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <Tabs value={editTab} onValueChange={(v: string) => setEditTab(v as "edit" | "preview")} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                                    <TabsTrigger value="edit" className="flex items-center gap-2">
                                        <FileText size={16} />
                                        Edit
                                    </TabsTrigger>
                                    <TabsTrigger value="preview" className="flex items-center gap-2">
                                        <Eye size={16} />
                                        Preview
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="edit" className="p-0">
                                    <textarea
                                        className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none dark:bg-gray-700 min-h-[300px] font-mono text-sm"
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        placeholder="Write your discussion content here. You can use Markdown for formatting."
                                    />
                                </TabsContent>
                                <TabsContent value="preview" className="p-4 min-h-[300px]">
                                    {editingContent ? (
                                        <div className="prose prose-blue dark:prose-invert max-w-none">
                                            <Markdown remarkPlugins={[remarkGfm]}>
                                                {editingContent}
                                            </Markdown>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400 italic">
                                            Nothing to preview yet. Start writing in the Edit tab.
                                        </p>
                                    )}
                                </TabsContent>
                            </Tabs>
                            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    💡 Tip: Use Markdown for formatting. Support for **bold**, *italic*, `code`, lists, headers (##), and more.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-blue dark:prose-invert max-w-none">
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {discussion.content}
                            </Markdown>
                        </div>
                    )}

                    {!isEditMode && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {isEditMode
                                    ? "Remember to save your changes before leaving this page."
                                    : "Join the discussion by leaving a comment below."
                                }
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section - Hidden during edit mode */}
            {!isEditMode && (
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
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Discussion"
            >
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        Are you sure you want to delete this discussion? This will also delete all comments. This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Delete Discussion
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}