import {PageResponse} from "../types/discussion.ts";
import {ContestDetailDto, ContestDto} from "../types/contest.ts";
import {apiClient} from "../api/client.ts";

const contestService = {
    getAllContests: async (page = 0, size = 10): Promise<PageResponse<ContestDto>> => {
        try {
            const response = await apiClient.get<PageResponse<ContestDto>>(`/contests?page=${page}&size=${size}`);
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
            const response = await apiClient.get<PageResponse<ContestDto>>(`/contests/past?page=${page}&size=${size}`);
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

    registerForContest: async (contestId: string): Promise<void> => {
        try {
            await apiClient.post(`/contests/${contestId}/register`);
        } catch (error) {
            console.error("Error registering for contest:", error);
            throw error;
        }
    }
}

export default contestService;