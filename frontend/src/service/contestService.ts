import { PageResponse } from "../types/discussion";
import { ContestDetailDto, ContestDto, ContestRegistrationDto, ContestLeaderboardEntryDto } from "../types/contest";
import { apiClient } from "../api/client";

const contestService = {
    // Main endpoints matching backend
    getAllContests: async (page = 0, size = 10, sort = "startTime,desc"): Promise<PageResponse<ContestDto>> => {
        try {
            const response = await apiClient.get<PageResponse<ContestDto>>(
                `/contests?page=${page}&size=${size}&sort=${sort}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching contests:", error);
            throw error;
        }
    },

    getContest: async (id: string): Promise<ContestDetailDto> => {
        try {
            const response = await apiClient.get<ContestDetailDto>(`/contests/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching contest:", error);
            throw error;
        }
    },

    getActiveContests: async (): Promise<ContestDto[]> => {
        try {
            const response = await apiClient.get<ContestDto[]>('/contests/active');
            return response.data;
        } catch (error) {
            console.error("Error fetching active contests:", error);
            throw error;
        }
    },

    getUpcomingContests: async (): Promise<ContestDto[]> => {
        try {
            const response = await apiClient.get<ContestDto[]>('/contests/upcoming');
            return response.data;
        } catch (error) {
            console.error("Error fetching upcoming contests:", error);
            throw error;
        }
    },

    getPastContests: async (page = 0, size = 10): Promise<PageResponse<ContestDto>> => {
        try {
            const response = await apiClient.get<PageResponse<ContestDto>>(
                `/contests/past?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching past contests:", error);
            throw error;
        }
    },

    searchContests: async (query: string, page = 0, size = 10): Promise<PageResponse<ContestDto>> => {
        try {
            const response = await apiClient.get<PageResponse<ContestDto>>(
                `/contests/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error searching contests:", error);
            throw error;
        }
    },

    registerForContest: async (contestId: string): Promise<ContestRegistrationDto> => {
        try {
            const response = await apiClient.post<ContestRegistrationDto>(
                `/contests/${contestId}/register`
            );
            return response.data;
        } catch (error) {
            console.error("Error registering for contest:", error);
            throw error;
        }
    },

    checkRegistrationStatus: async (contestId: string): Promise<{
        registered: boolean;
        contestId: string;
        contestTitle: string;
        userId: string;
        contestStatus: "UPCOMING" | "ACTIVE" | "ENDED";
    }> => {
        try {
            const response = await apiClient.get(
                `/contests/${contestId}/registration-status`
            );
            return response.data;
        } catch (error) {
            console.error("Error checking registration status:", error);
            throw error;
        }
    },

    getHistoricalLeaderboard: async (contestId: string): Promise<ContestLeaderboardEntryDto[]> => {
        try {
            const response = await apiClient.get<ContestLeaderboardEntryDto[]>(
                `/contests/${contestId}/historical-leaderboard`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching historical leaderboard:", error);
            throw error;
        }
    }
};

export default contestService;