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
    userId?: string;
    problemId: string;
    language: number;
    code?: string;
    status: string;
    time?: number;
    memory?: number;
    activeContestId?: string;
    testcases: Testcase[];
    createdAt: string;
    updatedAt?: string;
}

export interface SubmissionRequest {
    code: string;
    languageId: string;
    problemId: string;
    activeContestId?: string;
    token?: string;
}

export interface SubmissionResponse {
    id: string;
    [key: string]: any;
}