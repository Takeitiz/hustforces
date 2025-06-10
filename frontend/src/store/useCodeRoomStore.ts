import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
    CodeRoomDto,
    ParticipantDto,
    CursorPositionDto,
    MediaStateDto,
    CodeRoomDetailDto,
    ParticipantRole,
    ParticipantStatus
} from '../types/codeRoom';

interface CursorInfo {
    position: CursorPositionDto;
    colorHex: string;
    lastUpdate: number;
}

interface CodeRoomState {
    // Room info
    room: CodeRoomDto | null;
    currentCode: string;
    originalCode: string; // To track changes
    participants: Map<string, ParticipantDto>;
    currentUser: ParticipantDto | null;

    // Connection status
    isConnected: boolean;
    connectionError: string | null;
    isReconnecting: boolean;

    // Media state
    localMediaState: MediaStateDto;
    remoteMediaStates: Map<string, MediaStateDto>;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;

    // Editor state
    cursors: Map<string, CursorInfo>;
    typingUsers: Set<string>;

    // UI state
    showSettings: boolean;
    showParticipants: boolean;
    activeView: 'code' | 'video' | 'split';
    showCreateRoomModal: boolean;
    showJoinRoomModal: boolean;

    // Loading states
    isJoiningRoom: boolean;
    isCreatingRoom: boolean;
    isLeavingRoom: boolean;
    isSyncing: boolean;

    // Actions
    setRoom: (room: CodeRoomDto | null) => void;
    setRoomDetails: (details: CodeRoomDetailDto) => void;
    setCurrentCode: (code: string) => void;
    setOriginalCode: (code: string) => void;

    // Participant actions
    addParticipant: (participant: ParticipantDto) => void;
    removeParticipant: (userId: string) => void;
    updateParticipant: (userId: string, updates: Partial<ParticipantDto>) => void;
    setCurrentUser: (participant: ParticipantDto | null) => void;
    cleanupDisconnectedParticipants: () => void;

    // Connection actions
    setConnected: (connected: boolean) => void;
    setConnectionError: (error: string | null) => void;
    setReconnecting: (reconnecting: boolean) => void;

    // Media actions
    setLocalMediaState: (state: Partial<MediaStateDto>) => void;
    updateRemoteMediaState: (userId: string, state: MediaStateDto) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;

    // Editor actions
    updateCursor: (userId: string, position: CursorPositionDto, colorHex: string) => void;
    removeCursor: (userId: string) => void;
    setUserTyping: (userId: string, isTyping: boolean) => void;

    // UI actions
    setShowSettings: (show: boolean) => void;
    setShowParticipants: (show: boolean) => void;
    setActiveView: (view: 'code' | 'video' | 'split') => void;
    setShowCreateRoomModal: (show: boolean) => void;
    setShowJoinRoomModal: (show: boolean) => void;

    // Loading actions
    setJoiningRoom: (joining: boolean) => void;
    setCreatingRoom: (creating: boolean) => void;
    setLeavingRoom: (leaving: boolean) => void;
    setSyncing: (syncing: boolean) => void;

    // Utility actions
    reset: () => void;
    isHost: () => boolean;
    isCollaborator: () => boolean;
    isViewer: () => boolean;
    canEdit: () => boolean;
    getActiveParticipants: () => ParticipantDto[];
    isParticipantActive: (userId: string) => boolean;
}

const createInitialState = () => ({
    room: null,
    currentCode: '',
    originalCode: '',
    participants: new Map<string, ParticipantDto>(),
    currentUser: null,

    isConnected: false,
    connectionError: null,
    isReconnecting: false,

    localMediaState: {
        isMuted: true,
        isVideoOn: false,
        isScreenSharing: false
    },
    remoteMediaStates: new Map<string, MediaStateDto>(),
    localStream: null,
    remoteStreams: new Map<string, MediaStream>(),

    cursors: new Map<string, CursorInfo>(),
    typingUsers: new Set<string>(),

    showSettings: false,
    showParticipants: true,
    activeView: 'split' as const,
    showCreateRoomModal: false,
    showJoinRoomModal: false,

    isJoiningRoom: false,
    isCreatingRoom: false,
    isLeavingRoom: false,
    isSyncing: false,
});

const useCodeRoomStore = create<CodeRoomState>()(
    devtools(
        (set, get) => ({
            ...createInitialState(),

            // Room actions
            setRoom: (room) => set({ room }),

            // UPDATED: Fixed setRoomDetails to ensure proper state updates
            setRoomDetails: (details) => set((state) => {
                // Create completely new Map instances
                const participants = new Map<string, ParticipantDto>();

                // Deep clone participant objects
                details.participants.forEach(p => {
                    participants.set(p.userId, {
                        ...p,
                        cursorPosition: p.cursorPosition ? { ...p.cursorPosition } : undefined
                    });
                });

                // Get current user from localStorage
                const userStr = localStorage.getItem('user');
                const currentUserId = userStr ? JSON.parse(userStr).id : null;
                const currentUser = currentUserId
                    ? participants.get(currentUserId) || null
                    : null;

                return {
                    room: { ...details.room },
                    currentCode: details.currentCode,
                    originalCode: details.currentCode,
                    participants,
                    currentUser
                };
            }),

            setCurrentCode: (code) => set({ currentCode: code }),
            setOriginalCode: (code) => set({ originalCode: code }),

            // UPDATED: Fixed addParticipant to ensure immutability
            addParticipant: (participant) => set((state) => {
                const participants = new Map(state.participants);
                participants.set(participant.userId, { ...participant });

                // Check if this is the current user
                const userStr = localStorage.getItem('user');
                const currentUserId = userStr ? JSON.parse(userStr).id : null;

                return {
                    participants,
                    currentUser: participant.userId === currentUserId
                        ? { ...participant }
                        : state.currentUser
                };
            }),

            removeParticipant: (userId) => set((state) => {
                const participants = new Map(state.participants);
                participants.delete(userId);

                const cursors = new Map(state.cursors);
                cursors.delete(userId);

                const typingUsers = new Set(state.typingUsers);
                typingUsers.delete(userId);

                const remoteStreams = new Map(state.remoteStreams);
                const stream = remoteStreams.get(userId);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    remoteStreams.delete(userId);
                }

                return { participants, cursors, typingUsers, remoteStreams };
            }),

            // UPDATED: Fixed updateParticipant to ensure deep updates
            updateParticipant: (userId, updates) => set((state) => {
                const participants = new Map(state.participants);
                const participant = participants.get(userId);

                if (participant) {
                    const updatedParticipant = {
                        ...participant,
                        ...updates,
                        cursorPosition: updates.cursorPosition
                            ? { ...updates.cursorPosition }
                            : participant.cursorPosition
                    };
                    participants.set(userId, updatedParticipant);

                    // Update currentUser if it's the same user
                    const newState: Partial<CodeRoomState> = { participants };

                    if (state.currentUser?.userId === userId) {
                        newState.currentUser = updatedParticipant;
                    }

                    return newState;
                }

                return { participants };
            }),

            setCurrentUser: (participant) => set({ currentUser: participant }),

            // NEW: Add cleanup method for participants
            cleanupDisconnectedParticipants: () => set((state) => {
                const participants = new Map<string, ParticipantDto>();
                const now = Date.now();

                state.participants.forEach((participant, userId) => {
                    // Keep active participants and recently disconnected ones
                    if (participant.status === 'ACTIVE' ||
                        participant.status === 'IDLE' ||
                        (participant.status === 'DISCONNECTED' &&
                            state.cursors.get(userId)?.lastUpdate &&
                            now - state.cursors.get(userId)!.lastUpdate < 30000)) {
                        participants.set(userId, participant);
                    }
                });

                return { participants };
            }),

            // Connection actions
            setConnected: (connected) => set((prevState) => ({
                isConnected: connected,
                connectionError: connected ? null : prevState.connectionError,
                isReconnecting: false
            })),

            setConnectionError: (error) => set({ connectionError: error }),
            setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),

            // Media actions
            setLocalMediaState: (state) => set((prevState) => ({
                localMediaState: { ...prevState.localMediaState, ...state }
            })),

            updateRemoteMediaState: (userId, state) => set((prevState) => {
                const remoteMediaStates = new Map(prevState.remoteMediaStates);
                remoteMediaStates.set(userId, state);
                return { remoteMediaStates };
            }),

            setLocalStream: (stream) => set({ localStream: stream }),

            addRemoteStream: (userId, stream) => set((state) => {
                const remoteStreams = new Map(state.remoteStreams);
                remoteStreams.set(userId, stream);
                return { remoteStreams };
            }),

            removeRemoteStream: (userId) => set((state) => {
                const remoteStreams = new Map(state.remoteStreams);
                const stream = remoteStreams.get(userId);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    remoteStreams.delete(userId);
                }
                return { remoteStreams };
            }),

            // Editor actions
            updateCursor: (userId, position, colorHex) => set((state) => {
                const cursors = new Map(state.cursors);
                cursors.set(userId, {
                    position,
                    colorHex,
                    lastUpdate: Date.now()
                });
                return { cursors };
            }),

            removeCursor: (userId) => set((state) => {
                const cursors = new Map(state.cursors);
                cursors.delete(userId);
                return { cursors };
            }),

            setUserTyping: (userId, isTyping) => set((state) => {
                const typingUsers = new Set(state.typingUsers);
                if (isTyping) {
                    typingUsers.add(userId);
                } else {
                    typingUsers.delete(userId);
                }
                return { typingUsers };
            }),

            // UI actions
            setShowSettings: (show) => set({ showSettings: show }),
            setShowParticipants: (show) => set({ showParticipants: show }),
            setActiveView: (view) => set({ activeView: view }),
            setShowCreateRoomModal: (show) => set({ showCreateRoomModal: show }),
            setShowJoinRoomModal: (show) => set({ showJoinRoomModal: show }),

            // Loading actions
            setJoiningRoom: (joining) => set({ isJoiningRoom: joining }),
            setCreatingRoom: (creating) => set({ isCreatingRoom: creating }),
            setLeavingRoom: (leaving) => set({ isLeavingRoom: leaving }),
            setSyncing: (syncing) => set({ isSyncing: syncing }),

            // Utility actions
            reset: () => set(createInitialState()),

            isHost: () => {
                const state = get();
                return state.currentUser?.role === ParticipantRole.HOST;
            },

            isCollaborator: () => {
                const state = get();
                return state.currentUser?.role === ParticipantRole.COLLABORATOR;
            },

            isViewer: () => {
                const state = get();
                return state.currentUser?.role === ParticipantRole.VIEWER;
            },

            canEdit: () => {
                const state = get();
                return state.currentUser?.role === ParticipantRole.HOST ||
                    state.currentUser?.role === ParticipantRole.COLLABORATOR;
            },

            getActiveParticipants: () => {
                const state = get();
                const activeParticipants: ParticipantDto[] = [];
                state.participants.forEach(participant => {
                    if (participant.status === ParticipantStatus.ACTIVE) {
                        activeParticipants.push(participant);
                    }
                });
                return activeParticipants;
            },

            isParticipantActive: (userId: string) => {
                const state = get();
                const participant = state.participants.get(userId);
                return participant?.status === ParticipantStatus.ACTIVE;
            }
        }),
        {
            name: 'code-room-store',
        }
    )
);

export default useCodeRoomStore;