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
    ParticipantRole
} from "../types/codeRoom";
import authService from "./authService.ts";

/**
 * Service for handling code room-related API calls
 */
const codeRoomService = {
    /**
     * Check if backend is healthy and responding
     */
    checkBackendHealth: async (): Promise<boolean> => {
        try {
            const response = await apiClient.get('/health', {
                timeout: 3000
            });
            return response.status === 200;
        } catch (error) {
            console.error('Backend health check failed:', error);
            return false;
        }
    },

    /**
     * Wait for room to be ready on the backend
     */
    waitForRoomReady: async (roomCode: string, maxAttempts: number = 5): Promise<boolean> => {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Try to get room details as a way to check if it's ready
                const response = await apiClient.get(`/coderooms/code/${roomCode}`);
                if (response.data && response.data.room) {
                    return true;
                }
            } catch (error) {
                console.log(`Room not ready yet, attempt ${i + 1}/${maxAttempts}`);
            }

            if (i < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return false;
    },

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
        } catch (error: any) {
            // If the error is 409 (Conflict), it might mean user is already in the room
            if (error.response?.status === 409) {
                console.log('User might already be in the room, checking...');

                // Try to get room details to confirm
                try {
                    const roomDetails = await codeRoomService.getRoomByCode(request.roomCode);
                    const currentUser = authService.getCurrentUser();

                    if (currentUser && roomDetails.participants) {
                        const existingParticipant = roomDetails.participants.find(
                            p => p.userId === currentUser.id
                        );

                        if (existingParticipant) {
                            console.log('User is already a participant in this room');
                            return existingParticipant;
                        }
                    }
                } catch (checkError) {
                    console.error('Failed to check if user is already in room:', checkError);
                }
            }

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