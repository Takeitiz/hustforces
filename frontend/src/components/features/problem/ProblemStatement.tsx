"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Clock, Database } from "lucide-react"
import type { Problem } from "../../../types/problem"
import type { TestCase } from "../../../service/adminService"

interface ProblemStatementProps {
    problem: Problem
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
    const [testcases, setTestcases] = useState<TestCase[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In a real implementation, you might need to fetch test cases separately
        // if they're not included in the problem object
        const fetchTestCases = async () => {
            setLoading(true)
            try {
                // This is a placeholder for the actual API call
                // const response = await problemService.getProblemTestCases(problem.id);
                // setTestcases(response.testcases);

                // For now, we'll use mock data
                setTimeout(() => {
                    setTestcases([
                        {
                            id: "tc-1",
                            input: "[2,7,11,15]\n9",
                            output: "[0,1]",
                            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
                        },
                        {
                            id: "tc-2",
                            input: "[3,2,4]\n6",
                            output: "[1,2]",
                        },
                        {
                            id: "tc-3",
                            input: "[3,3]\n6",
                            output: "[0,1]",
                        },
                    ])
                    setLoading(false)
                }, 500)
            } catch (error) {
                console.error("Failed to fetch test cases:", error)
                setLoading(false)
            }
        }

        fetchTestCases()
    }, [problem.id])

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty.toUpperCase()) {
            case "EASY":
                return "bg-green-100 text-green-800"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800"
            case "HARD":
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Clock size={14} />
                            <span>{problem.timeLimit || 1}s</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <Database size={14} />
                            <span>{problem.memoryLimit || 256}MB</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Examples</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : testcases.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No examples available.</p>
                ) : (
                    <div className="space-y-6">
                        {testcases.map((testCase, index) => (
                            <div key={testCase.id} className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                                <h3 className="font-medium mb-2">Example {index + 1}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                      {testCase.input}
                    </pre>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output:</div>
                                        <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                      {testCase.output}
                    </pre>
                                    </div>
                                </div>
                                {testCase.explanation && (
                                    <div className="mt-3">
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Explanation:</div>
                                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm">{testCase.explanation}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
