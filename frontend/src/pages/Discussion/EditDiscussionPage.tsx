import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import discussionService from "../../service/discussionService";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DiscussionDetailDto } from "../../types/discussion";
import { useAuth } from "../../contexts/AuthContext";

export function EditDiscussionPage() {
    const { discussionId } = useParams<{ discussionId: string }>();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [discussion, setDiscussion] = useState<DiscussionDetailDto | null>(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchDiscussion = async () => {
            try {
                if (!discussionId) {
                    toast.error("Discussion ID is missing");
                    navigate("/discussions");
                    return;
                }

                const data = await discussionService.getDiscussion(discussionId);
                setDiscussion(data);
                setTitle(data.title);
                setContent(data.content);

                // Check if the current user is the author
                if (user?.id !== data.user.id) {
                    toast.error("You can only edit your own discussions");
                    navigate(`/discussions/${discussionId}`);
                }
            } catch (error) {
                console.error("Error fetching discussion:", error);
                toast.error("Failed to load discussion");
                navigate("/discussions");
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussion();
    }, [discussionId, navigate, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setSubmitting(true);

        try {
            await discussionService.updateDiscussion(discussionId!, title, content);
            toast.success("Discussion updated successfully");
            navigate(`/discussions/${discussionId}`);
        } catch (error) {
            console.error("Error updating discussion:", error);
            toast.error("Failed to update discussion");
        } finally {
            setSubmitting(false);
        }
    };

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
                    to={`/discussions/${discussionId}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft size={18} className="mr-1" />
                    Back to discussion
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">Edit Discussion</h1>

                    {discussion.problemId && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Discussion for problem:
                            </p>
                            <Link
                                to={`/problem/${discussion.problemId}`}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                {discussion.problemTitle}
                            </Link>
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
                                onClick={() => navigate(`/discussions/${discussionId}`)}
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
                                    "Update Discussion"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}