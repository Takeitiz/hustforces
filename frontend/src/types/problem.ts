export enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD"
}

export interface DefaultCode {
    id?: string;
    languageId: number;
    problemId?: string;
    code: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContestSubmission {
    // Add properties as needed based on your API
    id?: string;
    // Add other properties here when you have the data structure
}

export interface Contest {
    // Add properties as needed based on your API
    id?: string;
    // Add other properties here when you have the data structure
}

export interface Submission {
    // Add properties as needed based on your API
    id?: string;
    // Add other properties here when you have the data structure
}

export interface Problem {
    id: string;
    title: string;
    description: string;
    hidden: boolean;
    slug: string;
    solved: number;
    difficulty: Difficulty;
    defaultCode: DefaultCode[];
    contestSubmissions: ContestSubmission[];
    contests: Contest[];
    submissions: Submission[];
    createdAt: string;
    updatedAt: string;
}







