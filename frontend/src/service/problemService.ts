import {apiClient} from "../api/client.ts";
import {Problem} from "../types/problem.ts";
import axios from "axios";

/**
 * Service for handling problem-related API calls
 */
const problemService = {
    /**
     * Get a specific problem by ID
     *
     * @param {string} problemId - ID of the problem
     * @param {string} [contestId] - Optional contest ID if problem is part of a contest
     * @returns {Promise<Problem | null>} Problem data or null if not found
     */
    getProblem: async (problemId: string, contestId?: string): Promise<Problem | null> => {
        try {
            let url = `/problems/${problemId}`;

            if (contestId) {
                url += `?contestId=${contestId}`;
            }

            const response = await apiClient.get<Problem>(url);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            console.error('Error fetching problem:', error);
            throw error;
        }
    },

    /**
     * Get a list of all problems
     *
     * @returns {Promise<Problem[]>} Array of problems
     */
    getProblems: async (): Promise<Problem[]> => {
        try {
            const response = await apiClient.get<Problem[]>('/problems');
            return response.data;
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw error;
        }
    }
};

export default problemService;