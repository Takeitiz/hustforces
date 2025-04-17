import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { ContestDto } from "../../../types/contest";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";

interface ContestListProps {
    contests: ContestDto[];
    emptyMessage?: string;
}

export function ContestList({ contests, emptyMessage = "No contests found" }: ContestListProps) {
    if (contests.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {contests.map((contest) => (
                <div
                    key={contest.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
                >
                    <Link to={`/contests/${contest.id}`} className="block p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                    {contest.title}
                                </h2>

                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar size={16} className="mr-1" />
                                        {format(new Date(contest.startTime), "PPP")}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Clock size={16} className="mr-1" />
                                        {format(new Date(contest.startTime), "p")} - {format(new Date(contest.endTime), "p")}
                                    </div>

                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Users size={16} className="mr-1" />
                                        {contest.problems.length} problems
                                    </div>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                                    {contest.description}
                                </p>
                            </div>

                            <div className="ml-4">
                                {contest.status === 'UPCOMING' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                        Upcoming
                                    </span>
                                )}
                                {contest.status === 'ACTIVE' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                        Active
                                    </span>
                                )}
                                {contest.status === 'ENDED' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        Ended
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {contest.status === 'UPCOMING' && (
                                    <>Starts {formatDistanceToNow(new Date(contest.startTime), { addSuffix: true })}</>
                                )}
                                {contest.status === 'ACTIVE' && (
                                    <>Ends {formatDistanceToNow(new Date(contest.endTime), { addSuffix: true })}</>
                                )}
                                {contest.status === 'ENDED' && (
                                    <>Ended {formatDistanceToNow(new Date(contest.endTime), { addSuffix: true })}</>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                View Details
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    </Link>
                </div>
            ))}
        </div>
    );
}