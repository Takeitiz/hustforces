import {Problem} from "../../../types/problem.ts";
import {useState} from "react";
import {Tabs, TabsList, TabsTrigger} from "../../ui/Tabs.tsx";

export const ProblemSubmitBar: React.FC<{
    problem: Problem;
    contestId?: string;
}> = ({ problem, contestId }) => {
    const [activeTab, setActiveTab] = useState("problem");

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
            <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Tabs
                            defaultValue="problem"
                            className="rounded-md p-1"
                            value={activeTab}
                            onValueChange={setActiveTab}>
                            <TabsList className="grid grid-cols-2 w-full">
                                <TabsTrigger value="problem">Submit</TabsTrigger>
                                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                {/*<div className={`${activeTab === "problem" ? "" : "hidden"}`}>*/}
                {/*    <SubmitProblem problem={problem} contestId={contestId} />*/}
                {/*</div>*/}
                {/*{activeTab === "submissions" && <Submissions problem={problem} />}*/}
            </div>
        </div>
    );
}

