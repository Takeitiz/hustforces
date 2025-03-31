import {Testcase} from "../../../types/submission.ts";
import {renderTestResult} from "../../../utils/submissionUtils.tsx";

/**
 * Props interface for RenderTestcase component
 */
interface RenderTestcaseProps {
    testcases: Testcase[];
}

/**
 * Renders a grid of test case results
 *
 * @param {RenderTestcaseProps} props - Component props
 * @returns {JSX.Element | null}
 */
const RenderTestcase: React.FC<RenderTestcaseProps> = ({ testcases = [] }) => {
    if (testcases.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-6 gap-4">
            {testcases.map((testcase, index) => (
                <div key={index} className="border rounded-md">
                    <div className="px-2 pt-2 flex justify-center">
                        <div className="">Test #{index + 1}</div>
                    </div>
                    <div className="p-2 flex justify-center">
                        {renderTestResult(testcase.status_id)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RenderTestcase;