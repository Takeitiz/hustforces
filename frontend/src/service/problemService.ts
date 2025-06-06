import { apiClient } from "../api/client.ts";
import { Problem, ProblemDto, Difficulty } from "../types/problem.ts";
import { PageResponse } from "../types/pagination.ts";
import axios from "axios";
import {TestCase} from "./adminService.ts";

/**
 * Service for handling problem-related API calls
 */
const problemService = {
    /**
     * Get a specific problem by slug
     */
    getProblemBySlug: async (slug: string, contestId?: string): Promise<Problem | null> => {
        try {
            let url = `/problems/by-slug/${slug}`;
            if (contestId) {
                url += `?contestId=${contestId}`;
            }
            const response = await apiClient.get<Problem>(url);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            console.error('Error fetching problem by slug:', error);
            throw error;
        }
    },

    /**
     * Get paginated list of problems
     */
    getProblems: async (
        page: number = 0,
        size: number = 20,
        search?: string,
        difficulty?: Difficulty,
        sortBy: string = 'createdAt',
        sortDirection: 'ASC' | 'DESC' = 'DESC'
    ): Promise<PageResponse<ProblemDto>> => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                size: size.toString(),
                sort: `${sortBy},${sortDirection.toLowerCase()}`
            });

            if (search) {
                params.append('search', search);
            }
            if (difficulty) {
                params.append('difficulty', difficulty);
            }

            const response = await apiClient.get<PageResponse<ProblemDto>>(`/problems?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw error;
        }
    },

    /**
     * Get example test cases for a problem (limited to 3 for preview)
     */
    getProblemExamples: async (slug: string): Promise<TestCase[]> => {
        try {
            const response = await apiClient.get<TestCase[]>(`/problems/${slug}/examples`);
            return response.data;
        } catch (error) {
            console.error('Error fetching problem examples:', error);
            return [];
        }
    }
};

export default problemService;