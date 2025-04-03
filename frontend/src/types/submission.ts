export enum SubmissionStatus {
    SUBMIT = "SUBMIT",
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    FAILED = "FAILED"
}

export interface TestcaseDto {
    id?: number;
    status_id: number;
    stdin?: string;
    stdout?: string;
    expected_output?: string;
    stderr?: string;
    time?: number;
    memory?: number;
}

export interface SubmissionResponseDto {
    id: string;
    problemId: string;
    problemTitle: string;
    status: string;
    languageId: string;
    time: number;
    memory: number;
    createdAt: string;
    passedTestCases: number;
    totalTestCases: number;
}

export interface SubmissionDetailDto {
    id: string;
    problemId: string;
    problemTitle: string;
    userId: string;
    username: string;
    code: string;
    status: string;
    languageId: string;
    time: number;
    memory: number;
    createdAt: string;
    testcases: TestcaseDto[];
    activeContestId?: string;
}

