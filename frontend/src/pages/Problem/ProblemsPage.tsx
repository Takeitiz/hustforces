import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, Users, Target } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { ProblemDto, Difficulty } from "../../types/problem";
import { PageResponse } from "../../types/pagination";
import problemService from "../../service/problemService";
import { toast } from "react-toastify";

export function ProblemsPage() {
    const [problems, setProblems] = useState<PageResponse<ProblemDto>>({
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState<Difficulty | "ALL">("ALL");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        fetchProblems();
    }, [currentPage, difficulty, sortBy, sortDirection]);

    const fetchProblems = async () => {
        try {
            setLoading(true);
            const response = await problemService.getProblems(
                currentPage,
                20,
                search || undefined,
                difficulty === "ALL" ? undefined : difficulty,
                sortBy,
                sortDirection
            );
            setProblems(response);
        } catch (error) {
            console.error("Error fetching problems:", error);
            toast.error("Failed to load problems");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(0);
        fetchProblems();
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20";
            case "MEDIUM":
                return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20";
            case "HARD":
                return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20";
            default:
                return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20";
        }
    };

    const getAcceptanceRateColor = (rate: number) => {
        if (rate >= 60) return "text-green-600 dark:text-green-400";
        if (rate >= 40) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < problems.totalPages) {
            setCurrentPage(newPage);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Problems
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Practice coding problems and improve your skills
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search problems..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <Select
                            value={difficulty}
                            onValueChange={(value) => setDifficulty(value as Difficulty | "ALL")}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Difficulties</SelectItem>
                                <SelectItem value="EASY">Easy</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HARD">Hard</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={`${sortBy}-${sortDirection}`}
                            onValueChange={(value) => {
                                const [field, direction] = value.split('-');
                                setSortBy(field);
                                setSortDirection(direction as "ASC" | "DESC");
                            }}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt-DESC">Newest First</SelectItem>
                                <SelectItem value="createdAt-ASC">Oldest First</SelectItem>
                                <SelectItem value="difficulty-ASC">Difficulty (Easy → Hard)</SelectItem>
                                <SelectItem value="difficulty-DESC">Difficulty (Hard → Easy)</SelectItem>
                                <SelectItem value="solved-DESC">Most Solved</SelectItem>
                                <SelectItem value="solved-ASC">Least Solved</SelectItem>
                                <SelectItem value="acceptanceRate-DESC">Highest Acceptance</SelectItem>
                                <SelectItem value="acceptanceRate-ASC">Lowest Acceptance</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button type="submit" className="w-full md:w-auto">
                            Search
                        </Button>
                    </form>
                </div>

                {/* Problems List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : problems.empty ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            No problems found. Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Title
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Difficulty
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Acceptance
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Submissions
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Solved
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {problems.content.map((problem, index) => (
                                        <tr
                                            key={problem.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {currentPage * problems.size + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    to={`/problem/${problem.slug}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                                >
                                                    {problem.title}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                                                            problem.difficulty
                                                        )}`}
                                                    >
                                                        {problem.difficulty}
                                                    </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Target className="w-4 h-4 mr-1 text-gray-400" />
                                                    <span className={`text-sm font-medium ${getAcceptanceRateColor(problem.acceptanceRate)}`}>
                                                            {problem.acceptanceRate.toFixed(1)}%
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                <div className="flex items-center">
                                                    <Users className="w-4 h-4 mr-1 text-gray-400" />
                                                    {problem.totalSubmissions.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {problem.solved.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                Showing {currentPage * problems.size + 1} to{" "}
                                {Math.min((currentPage + 1) * problems.size, problems.totalElements)} of{" "}
                                {problems.totalElements} problems
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={problems.first}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>

                                {/* Page numbers */}
                                <div className="hidden md:flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, problems.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (problems.totalPages <= 5) {
                                            pageNum = i;
                                        } else if (currentPage <= 2) {
                                            pageNum = i;
                                        } else if (currentPage >= problems.totalPages - 3) {
                                            pageNum = problems.totalPages - 5 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handlePageChange(pageNum)}
                                                className="w-10"
                                            >
                                                {pageNum + 1}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={problems.last}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}