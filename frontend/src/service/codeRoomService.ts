import { apiClient } from "../api/client";
import {
    CodeRoomDto,
    CodeRoomDetailDto,
    CreateCodeRoomRequest,
    UpdateCodeRoomRequest,
    JoinCodeRoomRequest,
    ParticipantDto,
    SessionInfoDto,
    WebRTCConfigDto,
    PageResponse,
    ParticipantRole,
    SubmitCodeResponse
} from "../types/codeRoom";

/**
 * Service for handling code room-related API calls
 */
const codeRoomService = {
    /**
     * Create a new code room
     */
    createRoom: async (request: CreateCodeRoomRequest): Promise<CodeRoomDto> => {
        try {
            const response = await apiClient.post<CodeRoomDto>('/coderooms', request);
            return response.data;
        } catch (error) {
            console.error('Failed to create code room:', error);
            throw error;
        }
    },

    /**
     * Join a room by code
     */
    joinRoom: async (request: JoinCodeRoomRequest): Promise<ParticipantDto> => {
        try {
            const response = await apiClient.post<ParticipantDto>('/coderooms/join', request);
            return response.data;
        } catch (error) {
            console.error('Failed to join code room:', error);
            throw error;
        }
    },

    /**
     * Get room details
     */
    getRoomDetails: async (roomId: string): Promise<CodeRoomDetailDto> => {
        try {
            const response = await apiClient.get<CodeRoomDetailDto>(`/coderooms/${roomId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get room details:', error);
            throw error;
        }
    },

    /**
     * Get room by code
     */
    getRoomByCode: async (roomCode: string): Promise<CodeRoomDetailDto> => {
        try {
            const response = await apiClient.get<CodeRoomDetailDto>(`/coderooms/code/${roomCode}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get room by code:', error);
            throw error;
        }
    },

    /**
     * Leave room
     */
    leaveRoom: async (roomId: string): Promise<void> => {
        try {
            await apiClient.post(`/coderooms/${roomId}/leave`);
        } catch (error) {
            console.error('Failed to leave room:', error);
            throw error;
        }
    },

    /**
     * Update room settings (host only)
     */
    updateRoom: async (roomId: string, request: UpdateCodeRoomRequest): Promise<CodeRoomDto> => {
        try {
            const response = await apiClient.put<CodeRoomDto>(`/coderooms/${roomId}`, request);
            return response.data;
        } catch (error) {
            console.error('Failed to update room:', error);
            throw error;
        }
    },

    /**
     * Delete room (host only)
     */
    deleteRoom: async (roomId: string): Promise<void> => {
        try {
            await apiClient.delete(`/coderooms/${roomId}`);
        } catch (error) {
            console.error('Failed to delete room:', error);
            throw error;
        }
    },

    /**
     * Get public rooms
     */
    getPublicRooms: async (page: number = 0, size: number = 20): Promise<PageResponse<CodeRoomDto>> => {
        try {
            const response = await apiClient.get<PageResponse<CodeRoomDto>>('/coderooms/public', {
                params: { page, size }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get public rooms:', error);
            throw error;
        }
    },

    /**
     * Get rooms by problem
     */
    getRoomsByProblem: async (problemId: string): Promise<CodeRoomDto[]> => {
        try {
            const response = await apiClient.get<CodeRoomDto[]>(`/coderooms/problem/${problemId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get rooms by problem:', error);
            throw error;
        }
    },

    /**
     * Get rooms by contest
     */
    getRoomsByContest: async (contestId: string): Promise<CodeRoomDto[]> => {
        try {
            const response = await apiClient.get<CodeRoomDto[]>(`/coderooms/contest/${contestId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get rooms by contest:', error);
            throw error;
        }
    },

    /**
     * Get user's active rooms
     */
    getMyRooms: async (): Promise<CodeRoomDto[]> => {
        try {
            const response = await apiClient.get<CodeRoomDto[]>('/coderooms/my-rooms');
            return response.data;
        } catch (error) {
            console.error('Failed to get my rooms:', error);
            throw error;
        }
    },

    /**
     * End session
     */
    endSession: async (roomId: string): Promise<void> => {
        try {
            await apiClient.post(`/coderooms/${roomId}/end-session`);
        } catch (error) {
            console.error('Failed to end session:', error);
            throw error;
        }
    },

    /**
     * Get room sessions
     */
    getRoomSessions: async (roomId: string): Promise<SessionInfoDto[]> => {
        try {
            const response = await apiClient.get<SessionInfoDto[]>(`/coderooms/${roomId}/sessions`);
            return response.data;
        } catch (error) {
            console.error('Failed to get room sessions:', error);
            throw error;
        }
    },

    /**
     * Submit code from room
     */
    submitCode: async (roomId: string): Promise<SubmitCodeResponse> => {
        try {
            const response = await apiClient.post<SubmitCodeResponse>(`/coderooms/${roomId}/submit`);
            return response.data;
        } catch (error) {
            console.error('Failed to submit code:', error);
            throw error;
        }
    },

    /**
     * Get WebRTC configuration
     */
    getWebRTCConfig: async (): Promise<WebRTCConfigDto> => {
        try {
            const response = await apiClient.get<WebRTCConfigDto>('/coderooms/webrtc-config');
            return response.data;
        } catch (error) {
            console.error('Failed to get WebRTC config:', error);
            throw error;
        }
    },

    /**
     * Check user availability
     */
    checkAvailability: async (): Promise<{ available: boolean }> => {
        try {
            const response = await apiClient.get<{ available: boolean }>('/coderooms/check-availability');
            return response.data;
        } catch (error) {
            console.error('Failed to check availability:', error);
            throw error;
        }
    },

    // Participant Management

    /**
     * Get active participants
     */
    getParticipants: async (roomId: string): Promise<ParticipantDto[]> => {
        try {
            const response = await apiClient.get<ParticipantDto[]>(`/coderooms/${roomId}/participants`);
            return response.data;
        } catch (error) {
            console.error('Failed to get participants:', error);
            throw error;
        }
    },

    /**
     * Kick participant (host only)
     */
    kickParticipant: async (roomId: string, participantUserId: string): Promise<void> => {
        try {
            await apiClient.post(`/coderooms/${roomId}/participants/${participantUserId}/kick`);
        } catch (error) {
            console.error('Failed to kick participant:', error);
            throw error;
        }
    },

    /**
     * Update participant role (host only)
     */
    updateParticipantRole: async (
        roomId: string,
        participantUserId: string,
        role: ParticipantRole
    ): Promise<void> => {
        try {
            await apiClient.put(`/coderooms/${roomId}/participants/${participantUserId}/role`, null, {
                params: { role }
            });
        } catch (error) {
            console.error('Failed to update participant role:', error);
            throw error;
        }
    }
};

export default codeRoomService;