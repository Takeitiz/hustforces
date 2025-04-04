import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import discussionService from "../../service/discussionService";
import { DiscussionDto } from "../../types/discussion";
import { Button } from "../../components/ui/Button";
import { DiscussionList } from "../../components/features/discussion/DiscussionList";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function DiscussionForumPage() {
    const { problemId } = useParams<{ problemId?: string }>();
    const [discussions, setDiscussions] = useState<DiscussionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDiscussions();
    }, [problemId]);

    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            let result;
            if (problemId) {
                result = await discussionService.getDiscussionsByProblem(problemId);
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
            navigate("/login");
            return;
        }

        navigate(problemId
            ? `/problem/${problemId}/discussions/create`
            : "/discussions/create");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {problemId ? "Problem Discussions" : "Discussion Forum"}
                </h1>
                <Button
                    className="flex items-center gap-2"
                    onClick={handleCreateDiscussion}
                >
                    <Plus size={18} />
                    Start Discussion
                </Button>
            </div>

            <div className="flex gap-4 mb-6">
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
                <Button onClick={handleSearch}>Search</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <DiscussionList discussions={discussions} />
            )}
        </div>
    );
}