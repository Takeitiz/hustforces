import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import {
    ArrowLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { SubmissionResponseDto } from "../../types/submission";
import submissionService from "../../service/submissionService";
import { getLanguageName } from "../../constants/languageMapping";
import { Button } from "../../components/ui/Button";

export function UserSubmissionsPage() {
    const { username } = useParams<{ username: string }>();
    const [submissions, setSubmissions] = useState<SubmissionResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        if (username) {
            fetchSubmissions();
        }
    }, [username, page]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await submissionService.getUserSubmissions(username!, page, pageSize);
            setSubmissions(data.submissions);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
            setError(false);
        } catch (err) {
            console.error("Error fetching submissions:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "AC":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case "PENDING":
                return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />;
            default:
                return <XCircle className="h-5 w-5 text-red-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "AC":
                return "Accepted";
            case "PENDING":
                return "Processing";
            case "REJECTED":
                return "Wrong Answer";
            default:
                return status;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "AC":
                return "text-green-600 dark:text-green-400";
            case "PENDING":
                return "text-yellow-600 dark:text-yellow-400";
            default:
                return "text-red-600 dark:text-red-400";
        }
    };

    if (loading && page === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Failed to load submissions</p>
                    <Link to={`/profile/${username}`} className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
                        Back to profile
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link
                    to={`/profile/${username}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to profile
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-6">{username}'s Submissions</h1>

                    {submissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No submissions found
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Problem
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Language
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Time
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Memory
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Submitted
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    to={`/problem/${submission.problemId}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {submission.problemTitle}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(submission.status)}
                                                    <span className={`font-medium ${getStatusClass(submission.status)}`}>
                                                            {getStatusText(submission.status)}
                                                        </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {getLanguageName(submission.languageId)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {submission.time ? `${submission.time}s` : "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {submission.memory ? `${(submission.memory / 1024).toFixed(1)} MB` : "-"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {format(new Date(submission.createdAt), "MMM d, yyyy HH:mm")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <Link
                                                    to={`/submission/${submission.id}`}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    View Details
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} submissions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                                const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                                                if (pageNum >= totalPages) return null;
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={pageNum === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setPage(pageNum)}
                                                    >
                                                        {pageNum + 1}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page >= totalPages - 1}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}