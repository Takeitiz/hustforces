import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import solutionService from "../../service/solutionService";
import { SolutionDto } from "../../types/solution";
import { SolutionList } from "../../components/features/solution/SolutionList";
import { Button } from "../../components/ui/Button";
import { Plus, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import problemService from "../../service/problemService";
import { Problem } from "../../types/problem";

export function SolutionsPage() {
    const { problemId } = useParams<{ problemId?: string }>();
    const [solutions, setSolutions] = useState<SolutionDto[]>([]);
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchSolutions();
        if (problemId) {
            fetchProblem();
        }
    }, [problemId]);

    const fetchSolutions = async () => {
        setLoading(true);
        try {
            let result;
            if (problemId) {
                result = await solutionService.getSolutionsByProblem(problemId);
            } else {
                result = await solutionService.getAllSolutions();
            }
            setSolutions(result.content);
        } catch (error) {
            console.error("Error fetching solutions:", error);
            toast.error("Failed to load solutions");
        } finally {
            setLoading(false);
        }
    };

    const fetchProblem = async () => {
        try {
            const result = await problemService.getProblem(problemId!);
            setProblem(result);
        } catch (error) {
            console.error("Error fetching problem:", error);
        }
    };

    const handleSearch = async () => {
        // For now, searching is not supported on the backend
        // We could implement it if needed later
        toast.info("Search functionality coming soon!");
    };

    const handleCreateSolution = () => {
        if (!isLoggedIn) {
            toast.info("Please log in to share a solution");
            navigate("/login");
            return;
        }

        navigate(problemId
            ? `/problem/${problemId}/solutions/create`
            : "/solutions/create");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {problem
                        ? `Solutions for ${problem.title}`
                        : (problemId ? "Problem Solutions" : "All Solutions")}
                </h1>

                {problemId && (
                    <Button
                        className="flex items-center gap-2"
                        onClick={handleCreateSolution}
                    >
                        <Plus size={18} />
                        Share Solution
                    </Button>
                )}
            </div>

            {problem && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Problem:
                    </p>
                    <Link
                        to={`/problem/${problemId}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {problem.title}
                    </Link>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Browse user-submitted solutions or share your own approach.
                    </p>
                </div>
            )}

            <div className="flex gap-4 mb-6">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                        placeholder="Search solutions..."
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
                <SolutionList solutions={solutions} />
            )}
        </div>
    );
}