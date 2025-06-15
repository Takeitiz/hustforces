// frontend/src/service/standingsService.ts

import { apiClient } from "../api/client";
import { StandingResponse, StandingFilter, UserRankDetails } from "../types/standing";
// Import mock service for development
import mockStandingsService from "./mockStandingsService";

// Toggle this to use mock data during development
const USE_MOCK_DATA = false; // Set to false when backend is ready

/**
 * Service for handling standings-related API calls
 */
const realStandingsService = {
    /**
     * Get standings data with filters
     */
    getStandings: async (
        page: number = 0,
        size: number = 50,
        filters?: StandingFilter
    ): Promise<StandingResponse> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
            });

            if (filters) {
                if (filters.timeRange) params.append('timeRange', filters.timeRange);
                if (filters.category) params.append('category', filters.category);
                if (filters.contestId) params.append('contestId', filters.contestId);
            }

            const response = await apiClient.get<StandingResponse>(
                `/standings?${params.toString()}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching standings:', error);
            throw error;
        }
    },

    /**
     * Search users in standings
     */
    searchUsers: async (query: string, filters?: StandingFilter): Promise<StandingResponse> => {
        try {
            const params = new URLSearchParams({
                q: query,
            });

            if (filters) {
                if (filters.timeRange) params.append('timeRange', filters.timeRange);
                if (filters.category) params.append('category', filters.category);
                if (filters.contestId) params.append('contestId', filters.contestId);
            }

            const response = await apiClient.get<StandingResponse>(
                `/standings/search?${params.toString()}`
            );
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    },

    /**
     * Get user's rank details
     */
    getUserRank: async (userId: string): Promise<UserRankDetails> => {
        try {
            const response = await apiClient.get<UserRankDetails>(
                `/standings/user/${userId}/rank`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user rank:', error);
            throw error;
        }
    },

    /**
     * Get top performers for homepage widget
     */
    getTopPerformers: async (limit: number = 10): Promise<StandingResponse> => {
        try {
            const response = await apiClient.get<StandingResponse>(
                `/standings/top?limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching top performers:', error);
            throw error;
        }
    }
};

// Export either mock or real service based on configuration
const standingsService = USE_MOCK_DATA ? mockStandingsService : realStandingsService;

export default standingsService;