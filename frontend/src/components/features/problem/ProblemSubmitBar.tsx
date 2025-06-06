import { Problem } from "../../../types/problem.ts";
import SubmitProblem from "./SubmitProblem.tsx";

export const ProblemSubmitBar: React.FC<{
    problem: Problem;
    contestId?: string;
    onCodeChange?: (code: string, language: string) => void;
    hideSubmitButton?: boolean;
}> = ({ problem, contestId, onCodeChange, hideSubmitButton = false }) => {
    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                    {/* Header with Language Selection */}
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Code Editor
                        </h3>
                    </div>

                    {/* Code Editor */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <SubmitProblem
                            problem={problem}
                            contestId={contestId}
                            onCodeChange={onCodeChange}
                            hideSubmitButton={hideSubmitButton}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};