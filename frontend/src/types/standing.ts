export interface StandingUser {
    rank: number;
    userId: string;
    username: string;
    profilePicture?: string;
    problemsSolved: number;
    contestsAttended: number;
    totalSubmissions: number;
    acceptanceRate: number;
    rating: number;
    badges?: UserBadge[];
    lastActive: string;
}

export interface UserBadge {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
}

export interface StandingFilter {
    timeRange: 'all' | 'year' | 'month' | 'week';
    category: 'overall' | 'problems' | 'contests';
    contestId?: string;
}

export interface StandingResponse {
    users: StandingUser[];
    totalUsers: number;
    page: number;
    pageSize: number;
    lastUpdated: string;
}

export interface UserRankDetails {
    globalRank: number;
    countryRank?: number;
    percentile: number;
    trend: 'up' | 'down' | 'stable';
    trendValue: number;
}