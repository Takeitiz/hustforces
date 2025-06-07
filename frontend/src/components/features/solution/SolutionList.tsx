import { useState } from "react";
import { SolutionDto } from "../../../types/solution";
import { SolutionCard } from "./SolutionCard";
import { SolutionDetailView } from "./SolutionDetailView";

interface SolutionListProps {
    solutions: SolutionDto[];
    onSolutionUpdate?: () => void;
    onSelectSolution?: (id: string) => void;
}

export function SolutionList({ solutions, onSolutionUpdate, onSelectSolution }: SolutionListProps) {
    // Only manage local state if parent doesn't provide onSelectSolution
    const [localSelectedSolutionId, setLocalSelectedSolutionId] = useState<string | null>(null);

    // Use parent's selection handler if provided, otherwise use local state
    const handleSelectSolution = (id: string) => {
        if (onSelectSolution) {
            onSelectSolution(id);
        } else {
            setLocalSelectedSolutionId(id);
        }
    };

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

    // If managing local state and a solution is selected, show its detail view
    if (!onSelectSolution && localSelectedSolutionId) {
        return (
            <SolutionDetailView
                solutionId={localSelectedSolutionId}
                onBack={() => setLocalSelectedSolutionId(null)}
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
                    onClick={() => handleSelectSolution(solution.id)}
                />
            ))}
        </div>
    );
}