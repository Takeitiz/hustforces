import  { Difficulty } from "./problem.ts";

export interface UserProfile {
    user: {
        id: string;
        username: string;
        email: string;
        profilePicture?: string;
    };
    stats: UserStats;
    recentSubmissions: SubmissionHistory[];
    rankingHistory: RankingHistory[];
    submissionCalendar: Record<string, number>;
    problemsSolvedByDifficulty: Record<Difficulty, number>;
}

export interface UserStats {
    totalSubmissions: number;
    acceptedSubmissions: number;
    problemsSolved: number;
    contests: number;
    currentRank: number;
    maxRank: number;
}

export interface SubmissionHistory {
    id: string;
    problemId: string;
    problemTitle: string;
    status: string;
    languageId: string;
    createdAt: string;
}

export interface RankingHistory {
    date: string;
    rank: number;
    rating: number;
    contestId: string;
    contestName: string;
}