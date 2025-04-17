import {ContestLeaderboardEntryDto, ProblemSubmissionStatusDto} from "../types/contest.ts";
import {apiClient} from "../api/client.ts";


const leaderboardService = {
    getContestLeaderboard: async (contestId: string): Promise<ContestLeaderboardEntryDto[]> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto[]>(`/leaderboards/contest/${contestId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching contest leaderboard:", error);
            throw error;
        }
    },

    getCurrentUserRanking: async (contestId: string): Promise<ContestLeaderboardEntryDto> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto>(`/leaderboards/contest/${contestId}/user`);
            return response.data;
        } catch (error) {
            console.error("Error fetching current user ranking:", error);
            throw error;
        }
    },

    getUserRanking: async (contestId: string, userId: string): Promise<ContestLeaderboardEntryDto> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto>(`/leaderboards/contest/${contestId}/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user ranking:", error);
            throw error;
        }
    },

    getUserProblemStatuses: async (contestId: string, userId: string): Promise<ProblemSubmissionStatusDto[]> => {
        try {
            const response = await apiClient.get<ProblemSubmissionStatusDto[]>(`/leaderboards/contest/${contestId}/user/${userId}/problems`);
            return response.data;
        } catch (error) {
            console.error("Error fetching user problem statuses:", error);
            throw error;
        }
    }
};

export default leaderboardService;