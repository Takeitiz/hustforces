import { StandingResponse, StandingFilter, UserRankDetails, StandingUser } from "../types/standing";

const generateMockUser = (rank: number): StandingUser => {
    const usernames = [
        "CodeMaster", "AlgoWizard", "ByteNinja", "StackOverflow", "RecursiveGenius",
        "DynamicProgrammer", "GraphTraverser", "BitManipulator", "TreeClimber", "HashMapHero",
        "LinkedListLegend", "ArrayArtist", "QueueQueen", "StackSultan", "HeapHero"
    ];

    const baseRating = 2500 - (rank * 20);
    const problemsSolved = Math.max(300 - (rank * 10), 50);
    const totalSubmissions = problemsSolved * Math.floor(Math.random() * 3 + 2);
    const acceptedSubmissions = Math.floor(totalSubmissions * (0.9 - rank * 0.01));

    return {
        rank,
        userId: `user_${rank}`,
        username: usernames[rank % usernames.length] + rank,
        profilePicture: rank <= 3 ? `https://i.pravatar.cc/150?img=${rank}` : undefined,
        problemsSolved,
        contestsAttended: Math.max(50 - rank, 5),
        totalSubmissions,
        acceptanceRate: (acceptedSubmissions / totalSubmissions) * 100,
        rating: Math.max(baseRating + Math.floor(Math.random() * 200 - 100), 800),
        badges: rank <= 3 ? [
            {
                id: "top_performer",
                name: "Top Performer",
                icon: "trophy",
                color: rank === 1 ? "gold" : rank === 2 ? "silver" : "bronze",
                description: `Rank ${rank} performer`
            }
        ] : [],
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
};

/**
 * Mock implementation of standings service for testing
 */
const mockStandingsService = {
    getStandings: async (
        page: number = 0,
        size: number = 50,
        filters?: StandingFilter
    ): Promise<StandingResponse> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const totalUsers = 1000;
        const startIndex = page * size;
        const users: StandingUser[] = [];

        for (let i = 0; i < size && startIndex + i < totalUsers; i++) {
            users.push(generateMockUser(startIndex + i + 1));
        }

        // Apply filters (mock implementation)
        if (filters?.timeRange === 'week') {
            users.forEach(user => {
                user.problemsSolved = Math.floor(user.problemsSolved * 0.1);
                user.contestsAttended = Math.floor(user.contestsAttended * 0.2);
            });
        }

        return {
            users,
            totalUsers,
            page,
            pageSize: size,
            lastUpdated: new Date().toISOString()
        };
    },

    searchUsers: async (query: string, filters?: StandingFilter): Promise<StandingResponse> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const allUsers: StandingUser[] = [];
        for (let i = 1; i <= 100; i++) {
            allUsers.push(generateMockUser(i));
        }

        // First filter by search query
        let filteredUsers = allUsers.filter(user =>
            user.username.toLowerCase().includes(query.toLowerCase())
        );

        // Apply filters (mock implementation)
        if (filters?.timeRange === 'week') {
            filteredUsers = filteredUsers.map(user => ({
                ...user,
                problemsSolved: Math.floor(user.problemsSolved * 0.1),
                contestsAttended: Math.floor(user.contestsAttended * 0.2),
            }));
        } else if (filters?.timeRange === 'month') {
            filteredUsers = filteredUsers.map(user => ({
                ...user,
                problemsSolved: Math.floor(user.problemsSolved * 0.3),
                contestsAttended: Math.floor(user.contestsAttended * 0.4),
            }));
        }

        // Sort based on category
        if (filters?.category === 'problems') {
            filteredUsers.sort((a, b) => b.problemsSolved - a.problemsSolved);
        } else if (filters?.category === 'contests') {
            filteredUsers.sort((a, b) => b.contestsAttended - a.contestsAttended);
        } else {
            filteredUsers.sort((a, b) => b.rating - a.rating);
        }

        // Re-assign ranks after sorting
        filteredUsers = filteredUsers.map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        return {
            users: filteredUsers.slice(0, 20),
            totalUsers: filteredUsers.length,
            page: 0,
            pageSize: 20,
            lastUpdated: new Date().toISOString()
        };
    },

    getUserRank: async (userId: string): Promise<UserRankDetails> => {
        await new Promise(resolve => setTimeout(resolve, 200));

        const rank = parseInt(userId.split('_')[1]) || 42;
        const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';

        return {
            globalRank: rank,
            countryRank: Math.floor(rank / 10) + 1,
            percentile: Math.max(99 - (rank * 0.1), 1),
            trend,
            trendValue: trend === 'stable' ? 0 : Math.floor(Math.random() * 5) + 1
        };
    },

    getTopPerformers: async (limit: number = 10): Promise<StandingResponse> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const users: StandingUser[] = [];
        for (let i = 1; i <= limit; i++) {
            users.push(generateMockUser(i));
        }

        return {
            users,
            totalUsers: limit,
            page: 0,
            pageSize: limit,
            lastUpdated: new Date().toISOString()
        };
    }
};

export default mockStandingsService;