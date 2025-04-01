import type React from "react"
import type { Testcase } from "../../../types/submission.ts"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

/**
 * Props interface for RenderTestcase component
 */
interface RenderTestcaseProps {
    testcases: Testcase[]
}

/**
 * Renders a grid of test case results
 *
 * @param {RenderTestcaseProps} props - Component props
 * @returns {JSX.Element | null}
 */
const RenderTestcase: React.FC<RenderTestcaseProps> = ({ testcases = [] }) => {
    if (testcases.length === 0) {
        return null
    }

    const getStatusIcon = (statusId: number) => {
        switch (statusId) {
            case 1:
            case 2:
                return <Clock className="h-6 w-6 text-amber-500" />
            case 3:
                return <CheckCircle className="h-6 w-6 text-green-500" />
            case 4:
            case 6:
                return <XCircle className="h-6 w-6 text-red-500" />
            case 5:
                return <Clock className="h-6 w-6 text-red-500" />
            default:
                return <AlertTriangle className="h-6 w-6 text-gray-500" />
        }
    }

    const getStatusText = (statusId: number) => {
        switch (statusId) {
            case 1:
            case 2:
                return "Pending"
            case 3:
                return "Passed"
            case 4:
            case 6:
                return "Failed"
            case 5:
                return "Time Limit"
            case 13:
                return "Internal Error"
            case 14:
                return "Format Error"
            default:
                return "Runtime Error"
        }
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {testcases.map((testcase, index) => (
                <div
                    key={index}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Test #{index + 1}</div>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center">
                        {getStatusIcon(testcase.status_id)}
                        <div className="mt-2 text-sm font-medium text-center">{getStatusText(testcase.status_id)}</div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default RenderTestcase

