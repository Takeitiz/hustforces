// src/components/features/solution/SolutionList.tsx
import { SolutionDto } from "../../../types/solution";
import { SolutionCard } from "./SolutionCard";

interface SolutionListProps {
    solutions: SolutionDto[];
}

export function SolutionList({ solutions }: SolutionListProps) {
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

    return (
        <div className="space-y-4">
            {solutions.map((solution) => (
                <SolutionCard key={solution.id} solution={solution} />
            ))}
        </div>
    );
}