import { apiClient } from "../api/client";
import { DiscussionDto, DiscussionDetailDto, PageResponse } from "../types/discussion";

const discussionService = {
    getAllDiscussions: async (page = 0, size = 10): Promise<PageResponse<DiscussionDto>> => {
        try {
            const response = await apiClient.get<PageResponse<DiscussionDto>>(
                `/discussions?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching discussions:", error);
            throw error;
        }
    },

    getDiscussion: async (id: string): Promise<DiscussionDetailDto> => {
        try {
            const response = await apiClient.get<DiscussionDetailDto>(`/discussions/${id}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching discussion:", error);
            throw error;
        }
    },

    getDiscussionsByProblem: async (problemId: string, page = 0, size = 10): Promise<PageResponse<DiscussionDto>> => {
        try {
            const response = await apiClient.get<PageResponse<DiscussionDto>>(
                `/discussions/problem/${problemId}?page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching discussions by problem:", error);
            throw error;
        }
    },

    searchDiscussions: async (query: string, page = 0, size = 10): Promise<PageResponse<DiscussionDto>> => {
        try {
            const response = await apiClient.get<PageResponse<DiscussionDto>>(
                `/discussions/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`
            );
            return response.data;
        } catch (error) {
            console.error("Error searching discussions:", error);
            throw error;
        }
    },

    createDiscussion: async (title: string, content: string, problemId?: string): Promise<DiscussionDto> => {
        try {
            const response = await apiClient.post<DiscussionDto>("/discussions", {
                title,
                content,
                problemId
            });
            return response.data;
        } catch (error) {
            console.error("Error creating discussion:", error);
            throw error;
        }
    },

    updateDiscussion: async (id: string, title: string, content: string): Promise<DiscussionDto> => {
        try {
            const response = await apiClient.put<DiscussionDto>(`/discussions/${id}`, {
                title,
                content
            });
            return response.data;
        } catch (error) {
            console.error("Error updating discussion:", error);
            throw error;
        }
    },

    deleteDiscussion: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/discussions/${id}`);
        } catch (error) {
            console.error("Error deleting discussion:", error);
            throw error;
        }
    },

    voteDiscussion: async (id: string, isUpvote: boolean): Promise<DiscussionDto> => {
        try {
            const response = await apiClient.post<DiscussionDto>(
                `/discussions/${id}/vote?upvote=${isUpvote}`
            );
            return response.data;
        } catch (error) {
            console.error("Error voting on discussion:", error);
            throw error;
        }
    }
};

export default discussionService;