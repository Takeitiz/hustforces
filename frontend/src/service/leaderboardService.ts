import { ContestLeaderboardEntryDto, ProblemSubmissionStatusDto, LeaderboardPageDto } from "../types/contest";
import { apiClient } from "../api/client";

const leaderboardService = {
    // Get paginated leaderboard
    getContestLeaderboardPage: async (contestId: string, page = 0, size = 20): Promise<LeaderboardPageDto> => {
        try {
            const response = await apiClient.get<LeaderboardPageDto>(
                `/leaderboards/contest/${contestId}/page?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching contest leaderboard page:", error);
            throw error;
        }
    },

    getContestLeaderboard: async (contestId: string): Promise<ContestLeaderboardEntryDto[]> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto[]>(
                `/leaderboards/contest/${contestId}?full=true`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching contest leaderboard:", error);
            throw error;
        }
    },

    getCurrentUserRanking: async (contestId: string): Promise<ContestLeaderboardEntryDto> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto>(
                `/leaderboards/contest/${contestId}/user`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching current user ranking:", error);
            throw error;
        }
    },

    getUserRanking: async (contestId: string, userId: string): Promise<ContestLeaderboardEntryDto> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto>(
                `/leaderboards/contest/${contestId}/user/${userId}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching user ranking:", error);
            throw error;
        }
    },

    getUserProblemStatuses: async (contestId: string, userId: string): Promise<Map<string, ProblemSubmissionStatusDto>> => {
        try {
            const response = await apiClient.get<Map<string, ProblemSubmissionStatusDto>>(
                `/leaderboards/contest/${contestId}/user/${userId}/problems`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching user problem statuses:", error);
            throw error;
        }
    }
};

export default leaderboardService;