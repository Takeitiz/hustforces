import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { DiscussionDto } from "../../../types/discussion";

interface DiscussionCardProps {
    discussion: DiscussionDto;
    onClick: () => void;
}

export function DiscussionCard({ discussion, onClick }: DiscussionCardProps) {
    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 cursor-pointer"
            onClick={onClick}
        >
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {discussion.title}
                        </h2>

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {discussion.user.username}
                            </span>
                            <span>•</span>
                            <span>
                                {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                            </span>

                            {discussion.problemTitle && (
                                <>
                                    <span>•</span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                        {discussion.problemTitle}
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                            {discussion.content}
                        </p>
                    </div>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center mr-4">
                        <MessageSquare size={16} className="mr-1" />
                        <span>{discussion.commentCount} comments</span>
                    </div>

                    <div className="flex items-center mr-4">
                        <Eye size={16} className="mr-1" />
                        <span>{discussion.viewCount} views</span>
                    </div>

                    <div className="flex items-center mr-4">
                        <ThumbsUp size={16} className="mr-1" />
                        <span>{discussion.upvotes}</span>
                    </div>

                    <div className="flex items-center">
                        <ThumbsDown size={16} className="mr-1" />
                        <span>{discussion.downvotes}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}