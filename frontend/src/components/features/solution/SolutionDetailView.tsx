import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import solutionService from "../../../service/solutionService";
import commentService from "../../../service/commentService";
import { SolutionDetailDto } from "../../../types/solution";
import { CommentForm } from "../comment/CommentForm";
import { CommentList } from "../comment/CommentList";
import { User, ThumbsUp, ThumbsDown, ArrowLeft, Trash, Code, Loader2, Edit, X, Save, Eye, FileText } from "lucide-react";
import { Button } from "../../ui/Button";
import { useAuth } from "../../../contexts/AuthContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getLanguageName } from "../../../constants/languageMapping";
import MonacoEditor from "react-monaco-editor";
import { LANGUAGE_MAPPING } from "../../../constants/languageMapping";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/Tabs";
import {CommentDto} from "../../../types/discussion.ts";

// Type for react-markdown code component props
interface CodeProps extends React.HTMLAttributes<HTMLElement> {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

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

    // Edit mode states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCode, setEditingCode] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [editTab, setEditTab] = useState<"edit" | "preview">("edit");

    useEffect(() => {
        fetchSolution();
    }, [solutionId]);

    const fetchSolution = async () => {
        setLoading(true);
        try {
            const data = await solutionService.getSolution(solutionId);
            setSolution(data);
            // Initialize editing states
            setEditingCode(data.code);
            setEditingDescription(data.description);
        } catch (error) {
            console.error("Error fetching solution:", error);
            toast.error("Failed to load solution");
        } finally {
            setLoading(false);
        }
    };

    const handleCommentSubmit = async (content: string) => {
        if (!isLoggedIn) {
            toast.info("Please log in to comment");
            return;
        }

        try {
            const newComment = await commentService.createComment(content, null, solutionId);
            toast.success("Comment posted successfully");

            // Add the new comment to the solution
            setSolution(prev => {
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
        setSolution(prev => {
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
        setSolution(prev => {
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

    const handleEdit = () => {
        setIsEditMode(true);
        setEditTab("edit"); // Reset to edit tab when entering edit mode
    };

    const handleCancelEdit = () => {
        // Reset to original values
        if (solution) {
            setEditingCode(solution.code);
            setEditingDescription(solution.description);
        }
        setIsEditMode(false);
    };

    const handleSaveEdit = async () => {
        if (!editingCode.trim() || !editingDescription.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSaving(true);
        try {
            await solutionService.updateSolution(solutionId, editingCode, editingDescription);
            toast.success("Solution updated successfully");

            // Update local state with new values
            if (solution) {
                setSolution({
                    ...solution,
                    code: editingCode,
                    description: editingDescription
                });
            }

            setIsEditMode(false);
        } catch (error) {
            console.error("Error updating solution:", error);
            toast.error("Failed to update solution");
        } finally {
            setSaving(false);
        }
    };

    function handleEditorDidMount() {
        setIsEditorReady(true);
    }

    const canEditSolution = isLoggedIn && solution?.user.id === user?.id;

    // Find the language key from the languageId
    const getLanguageKey = (languageId: number | string): string => {
        const id = typeof languageId === 'string' ? parseInt(languageId) : languageId;
        return Object.keys(LANGUAGE_MAPPING).find(
            key => LANGUAGE_MAPPING[key].internal === id
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

    const languageKey = getLanguageKey(solution.languageId);

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
                    <div className="flex items-center gap-2 mb-4">
                        <Code size={20} className="text-blue-600 dark:text-blue-400" />
                        <h1 className="text-2xl font-bold">
                            Solution by {solution.user.username}
                        </h1>
                        <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-700 dark:text-blue-300 text-sm">
                            {getLanguageName(solution.languageId)}
                        </span>
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
                                        onClick={handleDelete}
                                    >
                                        <Trash size={16} className="mr-1" />
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Description Section */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Explanation</h2>
                        {isEditMode ? (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                <Tabs value={editTab} onValueChange={(v) => setEditTab(v as "edit" | "preview")} className="w-full">
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
                                            className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none dark:bg-gray-700 min-h-[200px] font-mono text-sm"
                                            value={editingDescription}
                                            onChange={(e) => setEditingDescription(e.target.value)}
                                            placeholder="Explain your solution approach. You can use Markdown for formatting:&#10;&#10;## Time Complexity&#10;O(n log n)&#10;&#10;## Approach&#10;1. First, we sort the array...&#10;2. Then we use binary search...&#10;&#10;**Key insight**: The problem can be reduced to..."
                                        />
                                    </TabsContent>
                                    <TabsContent value="preview" className="p-4 min-h-[200px]">
                                        {editingDescription ? (
                                            <div className="prose prose-blue dark:prose-invert max-w-none">
                                                <Markdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code: ({node, inline, className, children, ...props}: CodeProps) =>
                                                            inline ? (
                                                                <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-blue-600 dark:text-blue-400" {...props}>
                                                                    {children}
                                                                </code>
                                                            ) : (
                                                                <code className="block bg-gray-900 dark:bg-gray-950 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4" {...props}>
                                                                    {children}
                                                                </code>
                                                            ),
                                                    }}
                                                >
                                                    {editingDescription}
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
                            <div className="prose prose-blue dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
                                <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({children}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-900 dark:text-gray-100">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-900 dark:text-gray-100">{children}</h3>,
                                        p: ({children}) => <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>,
                                        ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">{children}</ol>,
                                        li: ({children}) => <li className="ml-4">{children}</li>,
                                        blockquote: ({children}) => (
                                            <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
                                                {children}
                                            </blockquote>
                                        ),
                                        strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                                        em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                                    }}
                                >
                                    {solution.description}
                                </Markdown>
                            </div>
                        )}
                    </div>

                    {/* Code Section */}
                    <div className="mt-8 mb-6">
                        <h2 className="text-lg font-semibold mb-3">Solution Code</h2>
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Code className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {getLanguageName(solution.languageId)}
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
                                    language={LANGUAGE_MAPPING[languageKey]?.monaco}
                                    theme="vs-dark"
                                    value={isEditMode ? editingCode : solution.code}
                                    options={{
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                        minimap: { enabled: true },
                                        lineNumbers: "on",
                                        wordWrap: "on",
                                        automaticLayout: true,
                                        fontFamily: "'Fira Code', monospace",
                                        fontLigatures: true,
                                        readOnly: !isEditMode
                                    }}
                                    onChange={isEditMode ? (value) => setEditingCode(value || "") : undefined}
                                    editorDidMount={handleEditorDidMount}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {isEditMode
                                ? "Remember to save your changes before leaving this page."
                                : "Like this solution? Consider leaving a comment to thank the author."
                            }
                        </div>
                        {!isEditMode && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleVote(true)}
                                >
                                    <ThumbsUp size={16} />
                                    <span>{solution.upvotes}</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={() => handleVote(false)}
                                >
                                    <ThumbsDown size={16} />
                                    <span>{solution.downvotes}</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comments Section - Hidden during edit mode */}
            {!isEditMode && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Comments</h2>

                    <CommentForm onSubmit={handleCommentSubmit} />

                    <div className="mt-6">
                        <CommentList
                            comments={solution.comments}
                            onCommentUpdate={handleCommentUpdate}
                            onCommentDelete={handleCommentDelete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}