import { CheckIcon, CircleX, ClockIcon} from "lucide-react";
import {JSX} from "react";

/**
 * Renders an appropriate icon or message based on the test case status
 *
 * @param {number | null} status - The status code of the test case
 * @returns {JSX.Element} - The icon or message component to display
 */
export function renderTestResult(status: number | null): JSX.Element {
    switch (status) {
        case 1:
        case 2:
            return <ClockIcon className="h-6 w-6 text-yellow-500"/>
        case 3:
            return <CheckIcon className="h-6 w-6 text-green-500"/>
        case 4:
        case 6:
            return <CircleX className="h-6 w-6 text-red-500"/>
        case 5:
            return <ClockIcon className="h-6 w-6 text-red-500"/>
        case 13:
            return <div className="text-gray-500">Internal Error!</div>;
        case 14:
            return <div className="text-gray-500">Exec Format Error!</div>;
        default:
            return <div className="text-gray-500">Runtime Error!</div>;
    }
}

/**
 * Helper function to determine the CSS class for a status badge
 *
 * @param {string} status - The submission status
 * @returns {string} - CSS class name
 */
export function getStatusClass(status: string): string {
    if (status === 'AC') return 'accepted';
    if (status === 'PENDING') return 'pending';
    return 'rejected';
}

