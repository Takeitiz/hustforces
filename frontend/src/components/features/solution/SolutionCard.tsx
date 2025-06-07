import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ThumbsUp, ThumbsDown, Code } from "lucide-react";
import { SolutionDto } from "../../../types/solution";
import { getLanguageName } from "../../../constants/languageMapping";

interface SolutionCardProps {
    solution: SolutionDto;
    onClick: () => void;
}

export function SolutionCard({ solution, onClick }: SolutionCardProps) {
    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <Code size={18} className="text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {solution.user.username}'s Solution
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                {getLanguageName(solution.languageId)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span>
                                {formatDistanceToNow(new Date(solution.createdAt), { addSuffix: true })}
                            </span>

                            {solution.problemTitle && (
                                <>
                                    <span>•</span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {solution.problemTitle}
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                            {solution.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mr-4">
                        <MessageSquare size={16} className="mr-1" />
                        <span>{solution.commentCount} comments</span>
                    </div>

                    <div className="flex items-center mr-4">
                        <ThumbsUp size={16} className="mr-1" />
                        <span>{solution.upvotes}</span>
                    </div>

                    <div className="flex items-center">
                        <ThumbsDown size={16} className="mr-1" />
                        <span>{solution.downvotes}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}