import { useState } from "react";
import { SolutionDto } from "../../../types/solution";
import { SolutionCard } from "./SolutionCard";
import { SolutionDetailView } from "./SolutionDetailView";

interface SolutionListProps {
    solutions: SolutionDto[];
    onSolutionUpdate?: () => void;
}

export function SolutionList({ solutions, onSolutionUpdate }: SolutionListProps) {
    const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null);

    if (solutions.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No solutions found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Be the first to share your solution!
                </p>
            </div>
        );
    }

    // If a solution is selected, show its detail view
    if (selectedSolutionId) {
        return (
            <SolutionDetailView
                solutionId={selectedSolutionId}
                onBack={() => setSelectedSolutionId(null)}
                onUpdate={onSolutionUpdate}
            />
        );
    }

    return (
        <div className="space-y-4">
            {solutions.map((solution) => (
                <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onClick={() => setSelectedSolutionId(solution.id)}
                />
            ))}
        </div>
    );
}