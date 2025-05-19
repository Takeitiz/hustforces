"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Edit, Trash2, Clock, Database } from "lucide-react"

interface TestCase {
    id: string
    input: string
    output: string
}

interface Problem {
    id: string
    title: string
    description: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    timeLimit: number
    memoryLimit: number
    tags: string[]
    sampleTestCases: TestCase[]
    hiddenTestCases: TestCase[]
    status: "ACTIVE" | "DRAFT" | "ARCHIVED"
    createdAt: string
    updatedAt: string
}

export const ProblemDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const [problem, setProblem] = useState<Problem | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In a real implementation, this would be an API call
        const fetchProblem = async () => {
            try {
                // Simulate API call
                setTimeout(() => {
                    const mockProblem: Problem = {
                        id: slug || "p1",
                        title: "Two Sum",
                        description: `
# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

## Example 1:

**Input:** nums = [2,7,11,15], target = 9
**Output:** [0,1]
**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

## Example 2:

**Input:** nums = [3,2,4], target = 6
**Output:** [1,2]

## Example 3:

**Input:** nums = [3,3], target = 6
**Output:** [0,1]

## Constraints:

- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.

**Follow-up:** Can you come up with an algorithm that is less than O(n²) time complexity?
            `,
                        difficulty: "EASY",
                        timeLimit: 1,
                        memoryLimit: 256,
                        tags: ["arrays", "hash-table"],
                        sampleTestCases: [
                            {
                                id: "stc-1",
                                input: "[2,7,11,15]\n9",
                                output: "[0,1]",
                            },
                            {
                                id: "stc-2",
                                input: "[3,2,4]\n6",
                                output: "[1,2]",
                            },
                            {
                                id: "stc-3",
                                input: "[3,3]\n6",
                                output: "[0,1]",
                            },
                        ],
                        hiddenTestCases: [
                            {
                                id: "htc-1",
                                input: "[1,2,3,4,5]\n9",
                                output: "[3,4]",
                            },
                            {
                                id: "htc-2",
                                input: "[-1,-2,-3,-4,-5]\n-8",
                                output: "[2,4]",
                            },
                        ],
                        status: "ACTIVE",
                        createdAt: "2023-05-15T10:30:00Z",
                        updatedAt: "2023-05-16T14:20:00Z",
                    }
                    setProblem(mockProblem)
                    setLoading(false)
                }, 1000)
            } catch (error) {
                console.error("Error fetching problem:", error)
                setLoading(false)
            }
        }

        fetchProblem()
    }, [slug])

    const handleDelete = () => {
        // In a real implementation, this would be an API call
        if (window.confirm("Are you sure you want to delete this problem?")) {
            // Simulate API call
            alert("Problem deleted successfully!")
            // Redirect to problems list
            window.location.href = "/admin/problems"
        }
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-blue-100 text-blue-800"
            case "DRAFT":
                return "bg-gray-100 text-gray-800"
            case "ARCHIVED":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (!problem) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Problem Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    The problem you're looking for doesn't exist or has been removed.
                </p>
                <Link
                    to="/admin/problems"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Back to Problems
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin/problems"
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Problems</span>
                    </Link>
                    <h1 className="text-2xl font-bold">{problem.title}</h1>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(problem.status)}`}>
            {problem.status}
          </span>
                </div>
                <div className="flex gap-2">
                    <Link
                        to={`/admin/problems/${problem.id}/edit`}
                        className="flex items-center gap-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                    >
                        <Edit size={18} />
                        <span>Edit</span>
                    </Link>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        <Trash2 size={18} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Sample Test Cases</h2>
                        <div className="space-y-6">
                            {problem.sampleTestCases.map((testCase, index) => (
                                <div key={testCase.id} className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                                    <h3 className="font-medium mb-2">Sample Test Case #{index + 1}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.input}
                      </pre>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.output}
                      </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Hidden Test Cases</h2>
                        <div className="space-y-6">
                            {problem.hiddenTestCases.map((testCase, index) => (
                                <div key={testCase.id} className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                                    <h3 className="font-medium mb-2">Hidden Test Case #{index + 1}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.input}
                      </pre>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.output}
                      </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Problem Details</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</div>
                                <div>{new Date(problem.createdAt).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</div>
                                <div>{new Date(problem.updatedAt).toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-gray-500" />
                                <div>
                                    <span className="font-medium">Time Limit:</span> {problem.timeLimit} seconds
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Database size={18} className="text-gray-500" />
                                <div>
                                    <span className="font-medium">Memory Limit:</span> {problem.memoryLimit} MB
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                                <div className="flex flex-wrap gap-2">
                                    {problem.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        >
                      {tag}
                    </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</div>
                                <div className="text-2xl font-bold">124</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted Submissions</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">78</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Acceptance Rate</div>
                                <div className="text-2xl font-bold">62.9%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
