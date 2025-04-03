import { Award, Code, CheckCircle, Calendar } from "lucide-react";
import { UserStats } from "../../../types/profile.ts";

interface ProfileStatsProps {
    stats: UserStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Statistics</h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-300">
                            <Code size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</p>
                            <p className="font-semibold">{stats.totalSubmissions}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-300">
                            <CheckCircle size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Accepted Solutions</p>
                            <p className="font-semibold">{stats.acceptedSubmissions}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-300">
                            <Award size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Problems Solved</p>
                            <p className="font-semibold">{stats.problemsSolved}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-300">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Contests Participated</p>
                            <p className="font-semibold">{stats.contests}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Current Rating</p>
                            <p className="font-semibold">{stats.currentRank}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Max Rating</p>
                            <p className="font-semibold">{stats.maxRank}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}