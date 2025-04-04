import { apiClient } from "../api/client";
import { SolutionDto, SolutionDetailDto } from "../types/solution";
import { PageResponse } from "../types/discussion";

const solutionService = {
    getAllSolutions: async (page = 0, size = 10): Promise<PageResponse<SolutionDto>> => {
        try {
            const response = await apiClient.get<PageResponse<SolutionDto>>(
                `/solutions?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching solutions:", error);
            throw error;
        }
    },

    getSolution: async (id: string): Promise<SolutionDetailDto> => {
        try {
            const response = await apiClient.get<SolutionDetailDto>(`/solutions/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching solution:", error);
            throw error;
        }
    },

    getSolutionsByProblem: async (problemId: string, page = 0, size = 10): Promise<PageResponse<SolutionDto>> => {
        try {
            const response = await apiClient.get<PageResponse<SolutionDto>>(
                `/solutions/problem/${problemId}?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching solutions by problem:", error);
            throw error;
        }
    },

    createSolution: async (
        code: string,
        description: string,
        problemId: string,
        languageId: string
    ): Promise<SolutionDto> => {
        try {
            const response = await apiClient.post<SolutionDto>("/solutions", {
                code,
                description,
                problemId,
                languageId
            });
            return response.data;
        } catch (error) {
            console.error("Error creating solution:", error);
            throw error;
        }
    },

    updateSolution: async (
        id: string,
        code: string,
        description: string
    ): Promise<SolutionDto> => {
        try {
            const response = await apiClient.put<SolutionDto>(`/solutions/${id}`, {
                code,
                description
            });
            return response.data;
        } catch (error) {
            console.error("Error updating solution:", error);
            throw error;
        }
    },

    deleteSolution: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/solutions/${id}`);
        } catch (error) {
            console.error("Error deleting solution:", error);
            throw error;
        }
    },

    voteSolution: async (id: string, isUpvote: boolean): Promise<SolutionDto> => {
        try {
            const response = await apiClient.post<SolutionDto>(
                `/solutions/${id}/vote?upvote=${isUpvote}`
            );
            return response.data;
        } catch (error) {
            console.error("Error voting on solution:", error);
            throw error;
        }
    }
};

export default solutionService;