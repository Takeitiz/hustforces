import { Problem } from "../../../types/problem.ts";
import SubmitProblem from "./SubmitProblem.tsx";
import React from "react";

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