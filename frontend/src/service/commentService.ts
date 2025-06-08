import { apiClient } from "../api/client";
import type { CommentDto } from "../types/discussion";

const commentService = {
    createComment: async (
        content: string,
        discussionId?: string | null,
        solutionId?: string | null,
        parentId?: string | null
    ): Promise<CommentDto> => {
        try {
            const response = await apiClient.post<CommentDto>("/comments", {
                content,
                discussionId,
                solutionId,
                parentId
            });
            return response.data;
        } catch (error) {
            console.error("Error creating comment:", error);
            throw error;
        }
    },

    updateComment: async (id: string, content: string): Promise<CommentDto> => {
        try {
            const response = await apiClient.put<CommentDto>(`/comments/${id}`, {
                content
            });
            return response.data;
        } catch (error) {
            console.error("Error updating comment:", error);
            throw error;
        }
    },

    deleteComment: async (id: string): Promise<void> => {
        try {
            await apiClient.delete(`/comments/${id}`);
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    },

    voteComment: async (id: string, isUpvote: boolean): Promise<CommentDto> => {
        try {
            // The backend should ideally return the updated comment DTO
            // including new upvotes/downvotes and potentially user's vote status
            const response = await apiClient.post<CommentDto>(
                `/comments/${id}/vote?upvote=${isUpvote}`
            );
            return response.data;
        } catch (error) {
            console.error("Error voting on comment:", error);
            throw error;
        }
    },

    getUserVote: async (commentId: string): Promise<'upvote' | 'downvote' | null> => {
        try {
            const response = await apiClient.get<{ vote: 'upvote' | 'downvote' | null }>(`/comments/${commentId}/user-vote`); // Assuming endpoint is /user-vote
            return response.data.vote;
        } catch (error) {
            console.error("Error fetching user vote for comment:", commentId, error);
            // Decide if to throw or return null. Returning null might be safer for UI.
            return null;
            // throw error;
        }
    },
};

export default commentService;
