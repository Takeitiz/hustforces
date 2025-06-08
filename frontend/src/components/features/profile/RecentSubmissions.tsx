import {Link, useParams} from "react-router-dom";
import { SubmissionHistory } from "../../../types/profile.ts";
import { getLanguageName } from "../../../constants/languageMapping.ts";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentSubmissionsProps {
    submissions: SubmissionHistory[];
}

export function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
    const { username } = useParams<{ username: string }>();

    if (submissions.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Recent Submissions</h2>
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        No submissions yet
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Submissions</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Problem</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Language</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Submitted</th>
                        </tr>
                        </thead>
                        <tbody>
                        {submissions.map((submission) => (
                            <tr key={submission.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-4 py-3">
                                    <Link
                                        to={`/problem/${submission.problemId}`}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    >
                                        {submission.problemTitle}
                                    </Link>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        {submission.status === 'AC' ? (
                                            <CheckCircle className="text-green-500 w-5 h-5 mr-1" />
                                        ) : submission.status === 'PENDING' ? (
                                            <Clock className="text-yellow-500 w-5 h-5 mr-1" />
                                        ) : (
                                            <XCircle className="text-red-500 w-5 h-5 mr-1" />
                                        )}
                                        <span className={
                                            submission.status === 'AC'
                                                ? 'text-green-600 dark:text-green-400'
                                                : submission.status === 'PENDING'
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : 'text-red-600 dark:text-red-400'
                                        }>
                                                {submission.status}
                                            </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {getLanguageName(submission.languageId)}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">
                                    {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-center">
                    <Link to={`/profile/${username}/submissions`} className="...">
                        View all submissions
                    </Link>
                </div>
            </div>
        </div>
    );
}