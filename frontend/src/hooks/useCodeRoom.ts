import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCodeRoomStore from '../store/useCodeRoomStore';
import codeRoomService from '../service/codeRoomService';
import codeRoomWebSocketService from '../service/codeRoomWebSocketService';
import authService from '../service/authService';
import {
    CreateCodeRoomRequest,
    UpdateCodeRoomRequest,
    ParticipantRole,
    CodeRoomStatus
} from '../types/codeRoom';

export function useCodeRoom() {
    const navigate = useNavigate();
    const [isInitializing, setIsInitializing] = useState(false);

    // Get all state and actions from store
    const {
        room,
        currentCode,
        participants,
        currentUser,
        isConnected,
        connectionError,
        isJoiningRoom,
        isCreatingRoom,
        isLeavingRoom,
        setRoom,
        setRoomDetails,
        setConnected,
        setConnectionError,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setJoiningRoom,
        setCreatingRoom,
        setLeavingRoom,
        setSyncing,
        reset,
        isHost,
        canEdit
    } = useCodeRoomStore();

    // Get auth token
    const getToken = useCallback(() => {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }
        return token;
    }, []);

    // Create a new code room
    const createRoom = useCallback(async (request: CreateCodeRoomRequest) => {
        try {
            setCreatingRoom(true);
            const newRoom = await codeRoomService.createRoom(request);
            setRoom(newRoom);
            toast.success('Room created successfully!');

            // Navigate to the room
            navigate(`/code-room/${newRoom.roomCode}`);

            return newRoom;
        } catch (error: any) {
            console.error('Failed to create room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to create room';
            toast.error(errorMessage);
            throw error;
        } finally {
            setCreatingRoom(false);
        }
    }, [navigate, setCreatingRoom, setRoom]);

    // Join an existing room - UPDATED WITH FIXES
    const joinRoom = useCallback(async (roomCode: string) => {
        try {
            setJoiningRoom(true);
            setIsInitializing(true);

            // First, join the room via REST API
            await codeRoomService.joinRoom({ roomCode });

            // Get full room details
            const roomDetails = await codeRoomService.getRoomByCode(roomCode);
            setRoomDetails(roomDetails);

            // Get auth token
            const token = getToken();

            // IMPORTANT: Set up listeners BEFORE connecting
            const listenersPromise = setupWebSocketListeners();

            // Connect to WebSocket
            await codeRoomWebSocketService.connect(roomDetails.room.id, token);

            // Wait for listeners to be set up
            await listenersPromise;

            // Ensure connection is established
            let retries = 0;
            while (!codeRoomWebSocketService.isConnected() && retries < 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                retries++;
            }

            if (!codeRoomWebSocketService.isConnected()) {
                throw new Error('Failed to establish WebSocket connection');
            }

            // Request initial sync only after everything is ready
            await codeRoomWebSocketService.requestSync();

            setConnected(true);
            toast.success('Joined room successfully!');

            return roomDetails;
        } catch (error: any) {
            console.error('Failed to join room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to join room';
            toast.error(errorMessage);
            setConnectionError(errorMessage);
            throw error;
        } finally {
            setJoiningRoom(false);
            setIsInitializing(false);
        }
    }, [getToken, setJoiningRoom, setRoomDetails, setConnected, setConnectionError]);

    // Leave the current room
    const leaveRoom = useCallback(async () => {
        if (!room) return;

        try {
            setLeavingRoom(true);

            // Leave room via API
            await codeRoomService.leaveRoom(room.id);

            // Disconnect WebSocket
            await codeRoomWebSocketService.disconnect();

            // Reset store
            reset();

            toast.success('Left room successfully');
            navigate('/code-rooms');
        } catch (error: any) {
            console.error('Failed to leave room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to leave room';
            toast.error(errorMessage);
        } finally {
            setLeavingRoom(false);
        }
    }, [room, navigate, reset, setLeavingRoom]);

    // Update room settings (host only)
    const updateRoomSettings = useCallback(async (updates: UpdateCodeRoomRequest) => {
        if (!room || !isHost()) {
            toast.error('Only the host can update room settings');
            return;
        }

        try {
            const updatedRoom = await codeRoomService.updateRoom(room.id, updates);
            setRoom(updatedRoom);
            toast.success('Room settings updated');
            return updatedRoom;
        } catch (error: any) {
            console.error('Failed to update room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to update room settings';
            toast.error(errorMessage);
            throw error;
        }
    }, [room, isHost, setRoom]);

    // Delete room (host only)
    const deleteRoom = useCallback(async () => {
        if (!room || !isHost()) {
            toast.error('Only the host can delete the room');
            return;
        }

        if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            return;
        }

        try {
            await codeRoomService.deleteRoom(room.id);
            toast.success('Room deleted successfully');
            navigate('/code-rooms');
        } catch (error: any) {
            console.error('Failed to delete room:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to delete room';
            toast.error(errorMessage);
        }
    }, [room, isHost, navigate]);

    // End session (host only)
    const endSession = useCallback(async () => {
        if (!room || !isHost()) {
            toast.error('Only the host can end the session');
            return;
        }

        try {
            await codeRoomService.endSession(room.id);
            toast.success('Session ended successfully');
            navigate('/code-rooms');
        } catch (error: any) {
            console.error('Failed to end session:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to end session';
            toast.error(errorMessage);
            throw error;
        }
    }, [room, isHost, navigate]);

    // Kick participant (host only)
    const kickParticipant = useCallback(async (userId: string) => {
        if (!room || !isHost()) {
            toast.error('Only the host can kick participants');
            return;
        }

        try {
            await codeRoomService.kickParticipant(room.id, userId);
            removeParticipant(userId);
            toast.success('Participant kicked');
        } catch (error: any) {
            console.error('Failed to kick participant:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to kick participant';
            toast.error(errorMessage);
        }
    }, [room, isHost, removeParticipant]);

    // Update participant role (host only)
    const updateParticipantRole = useCallback(async (userId: string, role: ParticipantRole) => {
        if (!room || !isHost()) {
            toast.error('Only the host can change participant roles');
            return;
        }

        try {
            await codeRoomService.updateParticipantRole(room.id, userId, role);
            updateParticipant(userId, { role });
            toast.success('Role updated successfully');
        } catch (error: any) {
            console.error('Failed to update role:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to update participant role';
            toast.error(errorMessage);
        }
    }, [room, isHost, updateParticipant]);

    // Submit code
    const submitCode = useCallback(async () => {
        if (!room) {
            toast.error('No active room');
            return;
        }

        try {
            const response = await codeRoomService.submitCode(room.id);
            toast.success('Code submitted successfully!');

            // Navigate to submission page
            navigate(`/submission/${response.submissionId}`);

            return response;
        } catch (error: any) {
            console.error('Failed to submit code:', error);
            const errorMessage = error.response?.data?.errorMessage || error.message || 'Failed to submit code';
            toast.error(errorMessage);
            throw error;
        }
    }, [room, navigate]);

    // Set up WebSocket event listeners - UPDATED WITH ASYNC HANDLING
    const setupWebSocketListeners = useCallback(async () => {
        // Handle participant events
        await codeRoomWebSocketService.onParticipantEvents({
            onJoined: (event) => {
                addParticipant(event.participant);
                toast.info(`${event.participant.username} joined the room`);
            },
            onLeft: (event) => {
                const currentParticipants = useCodeRoomStore.getState().participants;
                const participant = currentParticipants.get(event.userId);
                if (participant) {
                    removeParticipant(event.userId);
                    toast.info(`${participant.username} left the room`);
                }
            },
            onStatusChange: (event) => {
                updateParticipant(event.userId, { status: event.newStatus });
            },
            onRoleChange: (event) => {
                updateParticipant(event.userId, { role: event.newRole });
                const currentParticipants = useCodeRoomStore.getState().participants;
                const participant = currentParticipants.get(event.userId);
                if (participant) {
                    toast.info(`${participant.username}'s role changed to ${event.newRole}`);
                }
            }
        });

        // Handle room status updates
        await codeRoomWebSocketService.onRoomStatusUpdate((event) => {
            const currentRoom = useCodeRoomStore.getState().room;
            if ('message' in event) {
                // Room deleted
                toast.error(event.message);
                reset();
                navigate('/code-rooms');
            } else if (currentRoom) {
                // Room closed
                toast.info('Room has been closed');
                setRoom({ ...currentRoom, status: CodeRoomStatus.COMPLETED });
            }
        });

        // Handle room settings updates
        await codeRoomWebSocketService.onRoomSettingsUpdate((event) => {
            setRoom(event.room);
            toast.info('Room settings updated');
        });

        // Handle being kicked
        await codeRoomWebSocketService.onKicked((event) => {
            toast.error(event.message);
            reset();
            navigate('/code-rooms');
        });

        // Handle sync response
        await codeRoomWebSocketService.onSyncResponse((response) => {
            // Update current code and participants
            useCodeRoomStore.getState().setCurrentCode(response.currentCode);

            // Update participants
            response.participants.forEach(participant => {
                addParticipant(participant);
            });

            setSyncing(false);
        });

        // Handle errors
        await codeRoomWebSocketService.onError((error) => {
            console.error('WebSocket error:', error);
            toast.error(error.error);
            setConnectionError(error.error);
        });

        // Handle submission notifications
        await codeRoomWebSocketService.onCodeSubmitted((event) => {
            const currentParticipants = useCodeRoomStore.getState().participants;
            const participant = currentParticipants.get(event.userId);
            if (participant) {
                toast.info(`${participant.username} submitted code`);
            }
        });
    }, [navigate, reset, setRoom, addParticipant, removeParticipant, updateParticipant, setSyncing, setConnectionError]);

    // Handle connection state changes
    useEffect(() => {
        if (connectionError) {
            toast.error(`Connection error: ${connectionError}`);
        }
    }, [connectionError]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isConnected) {
                codeRoomWebSocketService.disconnect();
            }
        };
    }, [isConnected]);

    return {
        // State
        room,
        currentCode,
        participants,
        currentUser,
        isConnected,
        connectionError,
        isJoiningRoom,
        isCreatingRoom,
        isLeavingRoom,
        isInitializing,

        // Actions
        createRoom,
        joinRoom,
        leaveRoom,
        updateRoomSettings,
        deleteRoom,
        kickParticipant,
        updateParticipantRole,
        submitCode,
        endSession,

        // Utility
        isHost,
        canEdit,
        participantCount: participants.size,
        isRoomActive: room?.status === CodeRoomStatus.ACTIVE,
    };
}