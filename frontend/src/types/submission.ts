export enum SubmissionStatus {
    SUBMIT = "SUBMIT",
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    FAILED = "FAILED"
}

export interface Testcase {
    id?: string;
    submission_id?: string;
    status_id: number;
    time?: number;
    memory?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Submission {
    id: string;
    time?: string;
    memory?: string;
    problemId: string;
    languageId: string;
    code?: string;
    fullCode: string;
    status: string;
    testcases: {
        status: string;
        index: number;
    }[];
}
