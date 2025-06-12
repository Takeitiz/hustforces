import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Trophy, TrendingUp, TrendingDown, Minus, Filter, Award, Users, Target, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/Select";
import { StandingUser, StandingFilter, StandingResponse } from "../../types/standing";
import standingsService from "../../service/standingsService";
import { toast } from "react-toastify";

export function StandingsPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [standingsData, setStandingsData] = useState<StandingResponse | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState<StandingFilter>({
        timeRange: 'all',
        category: 'overall'
    });

    useEffect(() => {
        if (searchQuery.trim()) {
            handleSearch();
        } else {
            fetchStandings();
        }
    }, [currentPage, filters]);

    const fetchStandings = async () => {
        setLoading(true);
        try {
            const data = await standingsService.getStandings(currentPage, 50, filters);
            setStandingsData(data);
        } catch (error) {
            toast.error("Failed to load standings");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchStandings();
            return;
        }

        setLoading(true);
        try {
            const data = await standingsService.searchUsers(searchQuery, filters);
            setStandingsData(data);
        } catch (error) {
            toast.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Trophy className="w-5 h-5 text-orange-600" />;
        return null;
    };

    const getRankBadgeColor = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
        if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
        if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-600 text-white";
        if (rank <= 10) return "bg-gradient-to-r from-purple-500 to-purple-700 text-white";
        if (rank <= 50) return "bg-gradient-to-r from-blue-500 to-blue-700 text-white";
        if (rank <= 100) return "bg-gradient-to-r from-green-500 to-green-700 text-white";
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Global Standings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Overall rankings of all competitive programmers
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium">
                                    {standingsData?.totalUsers || 0} Users
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Bar */}
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            fetchStandings();
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Time Range Filter */}
                        <Select
                            value={filters.timeRange}
                            onValueChange={(value) => setFilters({ ...filters, timeRange: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Time Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Category Filter */}
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters({ ...filters, category: value as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="overall">Overall Rating</SelectItem>
                                <SelectItem value="problems">Problems Solved</SelectItem>
                                <SelectItem value="contests">Contest Performance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Standings Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {/* Active filters display */}
                {(searchQuery || filters.timeRange !== 'all' || filters.category !== 'overall') && (
                    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Active filters:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                                    Search: {searchQuery}
                                </span>
                            )}
                            {filters.timeRange !== 'all' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
                                    {filters.timeRange === 'week' ? 'This Week' :
                                        filters.timeRange === 'month' ? 'This Month' :
                                            filters.timeRange === 'year' ? 'This Year' : filters.timeRange}
                                </span>
                            )}
                            {filters.category !== 'overall' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200">
                                    {filters.category === 'problems' ? 'Problems Solved' :
                                        filters.category === 'contests' ? 'Contest Performance' : filters.category}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Problems
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Contests
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acceptance
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rating
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {standingsData?.users.map((user) => (
                                <tr
                                    key={user.userId}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/profile/${user.username}`)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getRankIcon(user.rank)}
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(user.rank)}`}>
                                                    #{user.rank}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {user.profilePicture ? (
                                                    <img
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={user.profilePicture}
                                                        alt={user.username}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.username}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Last active: {new Date(user.lastActive).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {user.problemsSolved}
                                                </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    solved
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center">
                                                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {user.contestsAttended}
                                                </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    attended
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex flex-col items-center">
                                                <span className={`text-lg font-semibold ${
                                                    user.acceptanceRate >= 60 ? 'text-green-600 dark:text-green-400' :
                                                        user.acceptanceRate >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                                                            'text-red-600 dark:text-red-400'
                                                }`}>
                                                    {user.acceptanceRate.toFixed(1)}%
                                                </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    acceptance
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-1">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {user.rating}
                                                </span>
                                            {/* You can add trend indicators here based on user data */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {standingsData && standingsData.totalUsers > 50 && (
                    <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={(currentPage + 1) * 50 >= standingsData.totalUsers}
                            >
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing{' '}
                                    <span className="font-medium">{currentPage * 50 + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-medium">
                                        {Math.min((currentPage + 1) * 50, standingsData.totalUsers)}
                                    </span>
                                    {' '}of{' '}
                                    <span className="font-medium">{standingsData.totalUsers}</span>
                                    {' '}users
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={(currentPage + 1) * 50 >= standingsData.totalUsers}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}