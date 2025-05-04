import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Trophy, CheckCircle, XCircle } from "lucide-react";
import {ContestDetailDto} from "../../../types/contest";
import { ContestLeaderboardEntryDto, ProblemSubmissionStatusDto } from "../../../types/contest";
import contestService from "../../../service/contestService";
import leaderboardService from "../../../service/leaderboardService";
import { toast } from "react-toastify";

interface UserContestProfileProps {
    userId: string;
    username: string;
}

export function UserContestProfile({ userId }: UserContestProfileProps) {
    const { contestId } = useParams<{ contestId: string }>();
    const [loading, setLoading] = useState(true);
    const [contest, setContest] = useState<ContestDetailDto | null>(null);
    const [userRanking, setUserRanking] = useState<ContestLeaderboardEntryDto | null>(null);
    const [problemStatuses, setProblemStatuses] = useState<ProblemSubmissionStatusDto[]>([]);

    useEffect(() => {
        if (contestId && userId) {
            fetchUserContestData();
        }
    }, [contestId, userId]);

    const fetchUserContestData = async () => {
        if (!contestId || !userId) return;

        setLoading(true);
        try {
            // Fetch all needed data in parallel
            const [contestData, userRankingData, problemStatusesData] = await Promise.all([
                contestService.getContest(contestId),
                leaderboardService.getUserRanking(contestId, userId),
                leaderboardService.getUserProblemStatuses(contestId, userId)
            ]);

            setContest(contestData);
            setUserRanking(userRankingData);
            setProblemStatuses(problemStatusesData);
        } catch (error) {
            console.error("Error fetching user contest data:", error);
            toast.error("Failed to load user contest data");
        } finally {
            setLoading(false);
        }
    };

    const renderProblemStatusIcon = (status: ProblemSubmissionStatusDto | undefined) => {
        if (!status) {
            return <div className="text-gray-400">-</div>;
        }

        if (status.solved) {
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        } else if (status.attempts > 0) {
            return <XCircle className="h-5 w-5 text-red-500" />;
        }

        return <div className="text-gray-400">-</div>;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!contest || !userRanking) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                    No contest data found for this user
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-indigo-500" />
                        {contest.title}
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Participated on {format(new Date(contest.startTime), "PPP")}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Rank</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            #{userRanking.rank}
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {userRanking.totalPoints}
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Problems Solved</div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {problemStatuses.filter(status => status.solved).length} / {contest.problems.length}
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Attempts</div>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {problemStatuses.reduce((sum, status) => sum + status.attempts, 0)}
                        </div>
                    </div>
                </div>

                <h3 className="text-lg font-medium mb-4">Problem Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Problem
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Points
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Attempts
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {contest.problems.map(problem => {
                            const status = problemStatuses.find(s => s.problemId === problem.problemId);
                            return (
                                <tr key={problem.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium mr-2">
                                                {String.fromCharCode(65 + problem.index)}.
                                            </div>
                                            <Link
                                                to={`/problem/${problem.problemId}`}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {problem.title}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {renderProblemStatusIcon(status)}
                                            <span className="ml-2 text-sm">
                                                    {status?.solved ? "Solved" : status?.attempts ? "Attempted" : "Not Attempted"}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {status?.points || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {status?.attempts || 0}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        to={`/contests/${contest.id}/leaderboard`}
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                        View Full Leaderboard
                        <ArrowLeft className="h-4 w-4 transform rotate-180" />
                    </Link>
                </div>
            </div>
        </div>
    );
}