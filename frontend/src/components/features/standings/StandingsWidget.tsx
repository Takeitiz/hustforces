import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";
import { StandingUser } from "../../../types/standing";
import standingsService from "../../../service/standingsService";
import { Button } from "../../ui/Button";

export function StandingsWidget() {
    const navigate = useNavigate();
    const [topUsers, setTopUsers] = useState<StandingUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopPerformers();
    }, []);

    const fetchTopPerformers = async () => {
        try {
            const data = await standingsService.getTopPerformers(5);
            setTopUsers(data.users);
        } catch (error) {
            console.error("Failed to fetch top performers:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return "text-yellow-500";
        if (rank === 2) return "text-gray-400";
        if (rank === 3) return "text-orange-600";
        return "text-gray-600 dark:text-gray-400";
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Performers
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/standings")}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            <div className="space-y-3">
                {topUsers.map((user) => (
                    <div
                        key={user.userId}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => navigate(`/profile/${user.username}`)}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-lg ${getRankColor(user.rank)}`}>
                                #{user.rank}
                            </span>
                            <div className="flex items-center gap-2">
                                {user.profilePicture ? (
                                    <img
                                        src={user.profilePicture}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {user.username}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {user.problemsSolved}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    problems
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {user.rating}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    rating
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}