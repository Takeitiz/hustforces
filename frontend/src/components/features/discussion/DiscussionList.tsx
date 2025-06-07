import { useState } from "react";
import { DiscussionDto } from "../../../types/discussion";
import { DiscussionCard } from "./DiscussionCard";
import { DiscussionDetailView } from "./DiscussionDetailView";

interface DiscussionListProps {
    discussions: DiscussionDto[];
    onDiscussionUpdate?: () => void;
}

export function DiscussionList({ discussions, onDiscussionUpdate }: DiscussionListProps) {
    const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | null>(null);

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

    // If a discussion is selected, show its detail view
    if (selectedDiscussionId) {
        return (
            <DiscussionDetailView
                discussionId={selectedDiscussionId}
                onBack={() => setSelectedDiscussionId(null)}
                onUpdate={onDiscussionUpdate}
            />
        );
    }

    return (
        <div className="space-y-4">
            {discussions.map((discussion) => (
                <DiscussionCard
                    key={discussion.id}
                    discussion={discussion}
                    onClick={() => setSelectedDiscussionId(discussion.id)}
                />
            ))}
        </div>
    );
}