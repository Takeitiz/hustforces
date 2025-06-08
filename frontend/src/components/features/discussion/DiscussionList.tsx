import { useState } from "react";
import { DiscussionDto } from "../../../types/discussion";
import { DiscussionCard } from "./DiscussionCard";
import { DiscussionDetailView } from "./DiscussionDetailView";

interface DiscussionListProps {
    discussions: DiscussionDto[];
    onDiscussionUpdate?: () => void;
    onSelectDiscussion?: (id: string) => void;
}

export function DiscussionList({ discussions, onDiscussionUpdate, onSelectDiscussion }: DiscussionListProps) {
    // Only manage local state if parent doesn't provide onSelectDiscussion
    const [localSelectedDiscussionId, setLocalSelectedDiscussionId] = useState<string | null>(null);

    // Use parent's selection handler if provided, otherwise use local state
    const handleSelectDiscussion = (id: string) => {
        if (onSelectDiscussion) {
            onSelectDiscussion(id);
        } else {
            setLocalSelectedDiscussionId(id);
        }
    };

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

    // If managing local state and a discussion is selected, show its detail view
    if (!onSelectDiscussion && localSelectedDiscussionId) {
        return (
            <DiscussionDetailView
                discussionId={localSelectedDiscussionId}
                onBack={() => setLocalSelectedDiscussionId(null)}
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
                    onClick={() => handleSelectDiscussion(discussion.id)}
                />
            ))}
        </div>
    );
}