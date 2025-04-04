// src/components/features/discussion/DiscussionList.tsx
import { DiscussionDto } from "../../../types/discussion";
import { DiscussionCard } from "./DiscussionCard";

interface DiscussionListProps {
    discussions: DiscussionDto[];
}

export function DiscussionList({ discussions }: DiscussionListProps) {
    if (discussions.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No discussions found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Be the first to start a discussion!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {discussions.map((discussion) => (
                <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}
        </div>
    );
}