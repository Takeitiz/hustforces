import { apiClient } from "../api/client";
import { CommentDto } from "../types/discussion";

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
            const response = await apiClient.post<CommentDto>(
                `/comments/${id}/vote?upvote=${isUpvote}`
            );
            return response.data;
        } catch (error) {
            console.error("Error voting on comment:", error);
            throw error;
        }
    }
};

export default commentService;