import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/Button";
import { Leaderboard } from "../../components/features/contest/Leaderboard";
import contestService from "../../service/contestService";
import leaderboardService from "../../service/leaderboardService";
import websocketService from "../../service/websocketService";
import { ContestDetailDto, ContestLeaderboardEntryDto } from "../../types/contest";
import { useAuth } from "../../contexts/AuthContext";

export function ContestLeaderboardPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [contest, setContest] = useState<ContestDetailDto | null>(null);
    const [leaderboard, setLeaderboard] = useState<ContestLeaderboardEntryDto[]>([]);
    const [userRanking, setUserRanking] = useState<ContestLeaderboardEntryDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLive, setIsLive] = useState(false);
    const leaderboardSubRef = useRef<string | null>(null);
    const userSubRef = useRef<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        if (id) {
            fetchContestAndLeaderboard();
        }
    }, [id]);

    // Set up WebSocket connection for active contests
    useEffect(() => {
        if (!contest || contest.status !== 'ACTIVE' || !id) {
            return;
        }

        // Connect to WebSocket if not already connected
        if (!websocketService.isConnected()) {
            websocketService.connect(
                () => {
                    console.log("WebSocket connected");
                    subscribeToUpdates();
                },
                (error) => {
                    console.error("WebSocket error:", error);
                    toast.error("Failed to connect to real-time updates");
                }
            );
        } else {
            subscribeToUpdates();
        }

        // Clean up subscriptions on unmount
        return () => {
            if (leaderboardSubRef.current) {
                websocketService.unsubscribe(leaderboardSubRef.current);
                leaderboardSubRef.current = null;
            }
            if (userSubRef.current) {
                websocketService.unsubscribe(userSubRef.current);
                userSubRef.current = null;
            }
            setIsLive(false);
        };
    }, [contest, id, user]);

    const fetchContestAndLeaderboard = async () => {
        if (!id) return;

        setLoading(true);
        try {
            // Fetch contest details
            const contestData = await contestService.getContest(id);
            setContest(contestData);

            // Fetch appropriate leaderboard based on contest status
            if (contestData.status === 'ENDED') {
                // Try to fetch historical leaderboard for ended contests
                try {
                    const historicalData = await contestService.getHistoricalLeaderboard(id);
                    setLeaderboard(historicalData);
                } catch (error) {
                    // If historical leaderboard is not available, fall back to regular leaderboard
                    const leaderboardData = await leaderboardService.getContestLeaderboard(id);
                    setLeaderboard(leaderboardData);
                }
            } else {
                // For active or upcoming contests, use regular leaderboard
                const leaderboardData = await leaderboardService.getContestLeaderboard(id);
                setLeaderboard(leaderboardData);
            }

            // Fetch user ranking if logged in
            if (user) {
                try {
                    const userRankingData = await leaderboardService.getUserRanking(id, user.id);
                    setUserRanking(userRankingData);
                } catch (error) {
                    // User might not be registered in the contest
                    console.log("User ranking not found");
                }
            }

            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load leaderboard data");
        } finally {
            setLoading(false);
        }
    };

    const subscribeToUpdates = () => {
        if (!id) return;

        // Subscribe to leaderboard updates
        const leaderboardSubId = websocketService.subscribe(
            `/topic/contest/${id}/leaderboard`,
            (message) => {
                setLeaderboard(message);
                setLastUpdated(new Date());
                setIsLive(true);
            }
        );
        leaderboardSubRef.current = leaderboardSubId;

        // Subscribe to user-specific updates if logged in
        if (user) {
            const userSubId = websocketService.subscribe(
                `/topic/contest/${id}/user/${user.id}`,
                (message) => {
                    setUserRanking(message);
                }
            );
            userSubRef.current = userSubId;

            // Request initial user data
            websocketService.send(`/app/contest/${id}/user/${user.id}/subscribe`, {});
        }

        // Request initial leaderboard data
        websocketService.send(`/app/contest/${id}/subscribe`, {});

        setIsLive(true);
    };

    const handleManualRefresh = async () => {
        if (refreshing || !id) return;

        setRefreshing(true);
        try {
            const data = await leaderboardService.getContestLeaderboard(id);
            setLeaderboard(data);
            setLastUpdated(new Date());
            toast.success("Leaderboard refreshed");
        } catch (error) {
            console.error("Error refreshing leaderboard:", error);
            toast.error("Failed to refresh leaderboard");
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!contest) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Contest not found</p>
                    <Link to="/contests" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Return to contests
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    to={`/contests/${id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Contest
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">{contest.title} - Leaderboard</h1>
                            <p className="text-gray-500 dark:text-gray-400">
                                {contest.problems.length} problems • {leaderboard.length} participants
                                {contest.status === 'ENDED' && ' • Final Results'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {isLive && contest.status === 'ACTIVE' && (
                                <div className="flex items-center">
                                    <span className="relative flex h-3 w-3 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Live updates</span>
                                </div>
                            )}

                            {lastUpdated && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Last updated: {lastUpdated.toLocaleTimeString()}
                                </div>
                            )}

                            {contest.status === 'ACTIVE' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleManualRefresh}
                                    disabled={refreshing}
                                    className="flex items-center gap-1"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            )}
                        </div>
                    </div>

                    {userRanking && user && (
                        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">Your Position</div>
                                <div className="flex items-center gap-4">
                                    <div className="text-lg font-bold">Rank: #{userRanking.rank}</div>
                                    <div className="text-lg font-bold">Score: {userRanking.totalPoints}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Leaderboard
                            leaderboard={leaderboard}
                            problems={contest.problems}
                            highlightCurrentUser={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}