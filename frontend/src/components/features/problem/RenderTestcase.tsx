import type React from "react"
import type { TestCase } from "../../../service/adminService"

interface RenderTestcaseProps {
    testCase: TestCase
    index: number
}

export const RenderTestcase: React.FC<RenderTestcaseProps> = ({ testCase, index }) => {
    return (
        <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
            <h3 className="font-medium mb-2">Test Case #{index + 1}</h3>
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
    )
}
