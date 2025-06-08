import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileCode, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { SubmissionResponseDto } from "../../types/submission";
import submissionService from "../../service/submissionService";
import profileService from "../../service/profileService";
import { formatDistanceToNow } from "date-fns";
import {getLanguageName} from "../../constants/languageMapping.ts";

export function UserSubmissionsPage() {
    const { username } = useParams<{ username: string }>();
    const [submissions, setSubmissions] = useState<SubmissionResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [userDisplayName, setUserDisplayName] = useState<string>("");

    useEffect(() => {
        if (username) {
            fetchUserData();
            fetchUserSubmissions();
        }
    }, [username]);

    const fetchUserData = async () => {
        try {
            const profile = await profileService.getUserProfile(username!);
            setUserDisplayName(profile.user.username);
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const fetchUserSubmissions = async () => {
        setLoading(true);
        try {
            const response = await submissionService.getUserSubmissions(username!);
            setSubmissions(response);
        } catch (error) {
            console.error("Error fetching user submissions:", error);
            toast.error("Failed to load submissions");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "AC":
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "PENDING":
                return <Clock className="w-5 h-5 text-yellow-500" />;
            default:
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "AC":
                return "Accepted";
            case "PENDING":
                return "Pending";
            case "FAIL":
                return "Wrong Answer";
            case "TLE":
                return "Time Limit Exceeded";
            case "COMPILATION_ERROR":
                return "Compilation Error";
            default:
                return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "AC":
                return "text-green-600 dark:text-green-400";
            case "PENDING":
                return "text-yellow-600 dark:text-yellow-400";
            default:
                return "text-red-600 dark:text-red-400";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    to={`/profile/${username}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Profile
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Submissions by {userDisplayName || username}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    View all problem submissions and their results
                </p>
            </div>

            {submissions.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        No submissions found
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                        Start solving problems to see your submissions here
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Problem
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Language
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Runtime
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Memory
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Submitted
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {submissions.map((submission) => (
                                <tr
                                    key={submission.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Link
                                            to={`/problem/${submission.problemId}`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                            {submission.problemTitle}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`flex items-center gap-2 ${getStatusColor(submission.status)}`}>
                                            {getStatusIcon(submission.status)}
                                            <span className="font-medium">
                                                    {getStatusText(submission.status)}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                        {getLanguageName(submission.languageId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                        {submission.time ? `${submission.time.toFixed(2)}s` : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                        {submission.memory ? `${submission.memory} KB` : "N/A"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}