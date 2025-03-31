import {Submission} from "../types/submission.ts";
import {apiClient} from "../api/client.ts";

/**
 * Service for handling submission-related API calls
 */
const submissionService = {

    /**
     * Get a list of submissions for a problem
     *
     * @param {string} problemId - ID of the problem
     * @returns {Promise<Submission[]>} - Array of submissions
     */
    getSubmissions: async (problemId: string): Promise<Submission[]> => {
        try {
            const response = await apiClient.get<{ submissions: Submission[] }>(`/api/submission/bulk?problemId=${problemId}`);
            return response.data.submissions || [];
        } catch (error) {
            console.log("Failed to fetch submissions", error);
            throw error;
        }
    },

    /**
     * Get submission details by ID
     *
     * @param {string} submissionId - ID of the submission
     * @returns {Promise<Submission>} - Submission details
     */
    getSubmissionStatus: async (submissionId: string): Promise<Submission> => {
        try {
            const response = await apiClient.get<{ submission: Submission }>(`/api/submission/?id=${submissionId}`);
            return response.data.submission;
        } catch (error) {
            console.error('Failed to fetch submission status:', error);
            throw error;
        }
    },

    /**
     * Submit code for evaluation
     *
     * @param {SubmissionRequest} submissionData - Submission data
     * @returns {Promise<SubmissionResponse>} - Submission result
     */
    submitCode: async (submissionData: SubmissionRequest): Promise<SubmissionResponse> => {
        try {
            const response = await apiClient.post<SubmissionResponse>('/api/submission/', submissionData);
            return response.data;
        } catch (error) {
            console.error('Submission failed:', error);
            throw error;
        }
    }
}

export default submissionService;