export interface ContestDto {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    hidden: boolean;
    leaderboard: boolean;
    createdAt: string;
    problems: ContestProblemInfoDto[];
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
}

export interface ContestDetailDto {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    hidden: boolean;
    createdAt: string;
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED';
    problems: ContestProblemInfoDto[];
    leaderboard: ContestLeaderboardEntryDto[];
}

export interface ContestProblemInfoDto {
    id: string;
    problemId: string;
    title: string;
    index: number;
    solved: number;
}

export interface ContestLeaderboardEntryDto {
    userId: string;
    username: string;
    rank: number;
    totalPoints: number;
    problemStatuses: ProblemSubmissionStatusDto[];
}

export interface ProblemSubmissionStatusDto {
    problemId: string;
    points: number;
    attempts: number;
    submissionId: string;
    solved: boolean;
}



