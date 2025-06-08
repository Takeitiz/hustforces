import { SubmissionDetailDto, SubmissionResponseDto } from "../types/submission.ts";
import { apiClient } from "../api/client.ts";

export interface SubmissionRequest {
    code: string;
    languageId: string;
    problemId: string;
    activeContestId?: string;
}

/**
 * Service for handling submission-related API calls
 */
const submissionService = {
    /**
     * Get a list of submissions for a problem
     *
     * @param {string} problemId - ID of the problem
     * @returns {Promise<SubmissionResponseDto[]>} - Array of submissions
     */
    getSubmissions: async (problemId: string): Promise<SubmissionResponseDto[]> => {
        try {
            const response = await apiClient.get<{ submissions: SubmissionResponseDto[] }>(
                `/submission?problemId=${problemId}`
            );
            return response.data.submissions || [];
        } catch (error) {
            console.error("Failed to fetch submissions", error);
            throw error;
        }
    },

    /**
     * Get submission details by ID
     *
     * @param {string} submissionId - ID of the submission
     * @returns {Promise<SubmissionDetailDto>} - Submission details
     */
    getSubmissionStatus: async (submissionId: string): Promise<SubmissionDetailDto> => {
        try {
            const response = await apiClient.get<SubmissionDetailDto>(`/submission/${submissionId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch submission status:', error);
            throw error;
        }
    },

    /**
     * Submit code for evaluation
     *
     * @param {SubmissionRequest} submissionData - Submission data
     * @returns {Promise<SubmissionDetailDto>} - Submission result
     */
    submitCode: async (submissionData: SubmissionRequest): Promise<SubmissionDetailDto> => {
        try {
            const response = await apiClient.post<SubmissionDetailDto>('/submission', submissionData);
            return response.data;
        } catch (error) {
            console.error('Submission failed:', error);
            throw error;
        }
    },

    /**
     * Get all submissions for a specific user
     *
     * @param {string} username - Username of the user
     * @returns {Promise<SubmissionResponseDto[]>} - Array of user's submissions
     */
    getUserSubmissions: async (username: string): Promise<SubmissionResponseDto[]> => {
        try {
            const response = await apiClient.get<{ submissions: SubmissionResponseDto[] }>(
                `/submission/user/${username}`
            );
            return response.data.submissions || [];
        } catch (error) {
            console.error("Failed to fetch user submissions", error);
            throw error;
        }
    },
};

export default submissionService;