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

export function ContestLeaderboardPage() {
    const { contestId } = useParams<{ contestId: string }>();
    const [contest, setContest] = useState<ContestDetailDto | null>(null);
    const [leaderboard, setLeaderboard] = useState<ContestLeaderboardEntryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [isLive, setIsLive] = useState(false);
    const subscriptionRef = useRef<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        if (contestId) {
            fetchContestAndLeaderboard();
        }
    }, [contestId]);

    // Set up WebSocket connection for active contests
    useEffect(() => {
        if (!contest || contest.status !== 'ACTIVE' || !contestId) {
            return;
        }

        // Connect to WebSocket if not already connected
        if (!websocketService.isConnected()) {
            websocketService.connect(
                () => {
                    console.log("WebSocket connected");
                    subscribeToLeaderboardUpdates();
                },
                (error) => {
                    console.error("WebSocket error:", error);
                    toast.error("Failed to connect to real-time updates");
                }
            );
        } else {
            subscribeToLeaderboardUpdates();
        }

        // Clean up subscription on unmount
        return () => {
            if (subscriptionRef.current) {
                websocketService.unsubscribe(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [contest, contestId]);

    const fetchContestAndLeaderboard = async () => {
        if (!contestId) return;

        setLoading(true);
        try {
            // Fetch contest details and leaderboard in parallel
            const [contestData, leaderboardData] = await Promise.all([
                contestService.getContest(contestId),
                leaderboardService.getContestLeaderboard(contestId)
            ]);

            setContest(contestData);
            setLeaderboard(leaderboardData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load leaderboard data");
        } finally {
            setLoading(false);
        }
    };

    const subscribeToLeaderboardUpdates = () => {
        if (!contestId) return;

        // Subscribe to leaderboard updates
        const subId = websocketService.subscribe(
            `/topic/contests/${contestId}/leaderboard`,
            (message) => {
                setLeaderboard(message);
                setLastUpdated(new Date());
                setIsLive(true);
            }
        );

        subscriptionRef.current = subId;
        setIsLive(true);
    };

    const handleManualRefresh = async () => {
        if (refreshing || !contestId) return;

        setRefreshing(true);
        try {
            const data = await leaderboardService.getContestLeaderboard(contestId);
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
                    to={`/contests/${contestId}`}
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
                        </div>
                    </div>

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