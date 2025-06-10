import React, {createContext, useContext, useReducer, useCallback, useMemo, useEffect} from 'react';
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
    originalCode: string;
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
}

type CodeRoomAction =
    | { type: 'SET_ROOM'; payload: CodeRoomDto | null }
    | { type: 'SET_ROOM_DETAILS'; payload: CodeRoomDetailDto }
    | { type: 'SET_CURRENT_CODE'; payload: string }
    | { type: 'SET_ORIGINAL_CODE'; payload: string }
    | { type: 'ADD_PARTICIPANT'; payload: ParticipantDto }
    | { type: 'REMOVE_PARTICIPANT'; payload: string }
    | { type: 'UPDATE_PARTICIPANT'; payload: { userId: string; updates: Partial<ParticipantDto> } }
    | { type: 'SET_CURRENT_USER'; payload: ParticipantDto | null }
    | { type: 'CLEANUP_DISCONNECTED_PARTICIPANTS' }
    | { type: 'SET_CONNECTED'; payload: boolean }
    | { type: 'SET_CONNECTION_ERROR'; payload: string | null }
    | { type: 'SET_RECONNECTING'; payload: boolean }
    | { type: 'SET_LOCAL_MEDIA_STATE'; payload: Partial<MediaStateDto> }
    | { type: 'UPDATE_REMOTE_MEDIA_STATE'; payload: { userId: string; state: MediaStateDto } }
    | { type: 'SET_LOCAL_STREAM'; payload: MediaStream | null }
    | { type: 'ADD_REMOTE_STREAM'; payload: { userId: string; stream: MediaStream } }
    | { type: 'REMOVE_REMOTE_STREAM'; payload: string }
    | { type: 'UPDATE_CURSOR'; payload: { userId: string; position: CursorPositionDto; colorHex: string } }
    | { type: 'REMOVE_CURSOR'; payload: string }
    | { type: 'SET_USER_TYPING'; payload: { userId: string; isTyping: boolean } }
    | { type: 'SET_SHOW_SETTINGS'; payload: boolean }
    | { type: 'SET_SHOW_PARTICIPANTS'; payload: boolean }
    | { type: 'SET_ACTIVE_VIEW'; payload: 'code' | 'video' | 'split' }
    | { type: 'SET_SHOW_CREATE_ROOM_MODAL'; payload: boolean }
    | { type: 'SET_SHOW_JOIN_ROOM_MODAL'; payload: boolean }
    | { type: 'SET_JOINING_ROOM'; payload: boolean }
    | { type: 'SET_CREATING_ROOM'; payload: boolean }
    | { type: 'SET_LEAVING_ROOM'; payload: boolean }
    | { type: 'SET_SYNCING'; payload: boolean }
    | { type: 'RESET' };

const initialState: CodeRoomState = {
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
    activeView: 'split',
    showCreateRoomModal: false,
    showJoinRoomModal: false,
    isJoiningRoom: false,
    isCreatingRoom: false,
    isLeavingRoom: false,
    isSyncing: false,
};

function codeRoomReducer(state: CodeRoomState, action: CodeRoomAction): CodeRoomState {
    switch (action.type) {
        case 'SET_ROOM':
            return { ...state, room: action.payload };

        case 'SET_ROOM_DETAILS': {
            const details = action.payload;
            const participants = new Map<string, ParticipantDto>();

            details.participants.forEach(p => {
                participants.set(p.userId, {
                    ...p,
                    cursorPosition: p.cursorPosition ? { ...p.cursorPosition } : undefined
                });
            });

            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : null;
            const currentUser = currentUserId ? participants.get(currentUserId) || null : null;

            return {
                ...state,
                room: { ...details.room },
                currentCode: details.currentCode,
                originalCode: details.currentCode,
                participants,
                currentUser
            };
        }

        case 'SET_CURRENT_CODE':
            return { ...state, currentCode: action.payload };

        case 'SET_ORIGINAL_CODE':
            return { ...state, originalCode: action.payload };

        case 'ADD_PARTICIPANT': {
            const participants = new Map(state.participants);
            participants.set(action.payload.userId, { ...action.payload });

            const userStr = localStorage.getItem('user');
            const currentUserId = userStr ? JSON.parse(userStr).id : null;

            return {
                ...state,
                participants,
                currentUser: action.payload.userId === currentUserId ? { ...action.payload } : state.currentUser
            };
        }

        case 'REMOVE_PARTICIPANT': {
            const userId = action.payload;
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

            return { ...state, participants, cursors, typingUsers, remoteStreams };
        }

        case 'UPDATE_PARTICIPANT': {
            const { userId, updates } = action.payload;
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

                if (state.currentUser?.userId === userId) {
                    return {
                        ...state,
                        participants,
                        currentUser: updatedParticipant
                    };
                }
            }

            return { ...state, participants };
        }

        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload };

        case 'CLEANUP_DISCONNECTED_PARTICIPANTS': {
            const participants = new Map<string, ParticipantDto>();
            const now = Date.now();

            state.participants.forEach((participant, userId) => {
                if (participant.status === 'ACTIVE' ||
                    participant.status === 'IDLE' ||
                    (participant.status === 'DISCONNECTED' &&
                        state.cursors.get(userId)?.lastUpdate &&
                        now - state.cursors.get(userId)!.lastUpdate < 30000)) {
                    participants.set(userId, participant);
                }
            });

            return { ...state, participants };
        }

        case 'SET_CONNECTED':
            return {
                ...state,
                isConnected: action.payload,
                connectionError: action.payload ? null : state.connectionError,
                isReconnecting: false
            };

        case 'SET_CONNECTION_ERROR':
            return { ...state, connectionError: action.payload };

        case 'SET_RECONNECTING':
            return { ...state, isReconnecting: action.payload };

        case 'SET_LOCAL_MEDIA_STATE':
            return {
                ...state,
                localMediaState: { ...state.localMediaState, ...action.payload }
            };

        case 'UPDATE_REMOTE_MEDIA_STATE': {
            const remoteMediaStates = new Map(state.remoteMediaStates);
            remoteMediaStates.set(action.payload.userId, action.payload.state);
            return { ...state, remoteMediaStates };
        }

        case 'SET_LOCAL_STREAM':
            return { ...state, localStream: action.payload };

        case 'ADD_REMOTE_STREAM': {
            const remoteStreams = new Map(state.remoteStreams);
            remoteStreams.set(action.payload.userId, action.payload.stream);
            return { ...state, remoteStreams };
        }

        case 'REMOVE_REMOTE_STREAM': {
            const remoteStreams = new Map(state.remoteStreams);
            const stream = remoteStreams.get(action.payload);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                remoteStreams.delete(action.payload);
            }
            return { ...state, remoteStreams };
        }

        case 'UPDATE_CURSOR': {
            const cursors = new Map(state.cursors);
            cursors.set(action.payload.userId, {
                position: action.payload.position,
                colorHex: action.payload.colorHex,
                lastUpdate: Date.now()
            });
            return { ...state, cursors };
        }

        case 'REMOVE_CURSOR': {
            const cursors = new Map(state.cursors);
            cursors.delete(action.payload);
            return { ...state, cursors };
        }

        case 'SET_USER_TYPING': {
            const typingUsers = new Set(state.typingUsers);
            if (action.payload.isTyping) {
                typingUsers.add(action.payload.userId);
            } else {
                typingUsers.delete(action.payload.userId);
            }
            return { ...state, typingUsers };
        }

        case 'SET_SHOW_SETTINGS':
            return { ...state, showSettings: action.payload };

        case 'SET_SHOW_PARTICIPANTS':
            return { ...state, showParticipants: action.payload };

        case 'SET_ACTIVE_VIEW':
            return { ...state, activeView: action.payload };

        case 'SET_SHOW_CREATE_ROOM_MODAL':
            return { ...state, showCreateRoomModal: action.payload };

        case 'SET_SHOW_JOIN_ROOM_MODAL':
            return { ...state, showJoinRoomModal: action.payload };

        case 'SET_JOINING_ROOM':
            return { ...state, isJoiningRoom: action.payload };

        case 'SET_CREATING_ROOM':
            return { ...state, isCreatingRoom: action.payload };

        case 'SET_LEAVING_ROOM':
            return { ...state, isLeavingRoom: action.payload };

        case 'SET_SYNCING':
            return { ...state, isSyncing: action.payload };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

interface CodeRoomContextValue extends CodeRoomState {
    // Actions
    setRoom: (room: CodeRoomDto | null) => void;
    setRoomDetails: (details: CodeRoomDetailDto) => void;
    setCurrentCode: (code: string) => void;
    setOriginalCode: (code: string) => void;
    addParticipant: (participant: ParticipantDto) => void;
    removeParticipant: (userId: string) => void;
    updateParticipant: (userId: string, updates: Partial<ParticipantDto>) => void;
    setCurrentUser: (participant: ParticipantDto | null) => void;
    cleanupDisconnectedParticipants: () => void;
    setConnected: (connected: boolean) => void;
    setConnectionError: (error: string | null) => void;
    setReconnecting: (reconnecting: boolean) => void;
    setLocalMediaState: (state: Partial<MediaStateDto>) => void;
    updateRemoteMediaState: (userId: string, state: MediaStateDto) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    addRemoteStream: (userId: string, stream: MediaStream) => void;
    removeRemoteStream: (userId: string) => void;
    updateCursor: (userId: string, position: CursorPositionDto, colorHex: string) => void;
    removeCursor: (userId: string) => void;
    setUserTyping: (userId: string, isTyping: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setShowParticipants: (show: boolean) => void;
    setActiveView: (view: 'code' | 'video' | 'split') => void;
    setShowCreateRoomModal: (show: boolean) => void;
    setShowJoinRoomModal: (show: boolean) => void;
    setJoiningRoom: (joining: boolean) => void;
    setCreatingRoom: (creating: boolean) => void;
    setLeavingRoom: (leaving: boolean) => void;
    setSyncing: (syncing: boolean) => void;
    reset: () => void;

    // Computed values
    isHost: () => boolean;
    isCollaborator: () => boolean;
    isViewer: () => boolean;
    canEdit: () => boolean;
    getActiveParticipants: () => ParticipantDto[];
    isParticipantActive: (userId: string) => boolean;
}

const CodeRoomContext = createContext<CodeRoomContextValue | undefined>(undefined);

export const CodeRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(codeRoomReducer, initialState);

    // Update the current state ref whenever state changes
    useEffect(() => {
        currentStateRef = { ...state };
    }, [state]);

    // Actions
    const setRoom = useCallback((room: CodeRoomDto | null) => {
        dispatch({ type: 'SET_ROOM', payload: room });
    }, []);

    const setRoomDetails = useCallback((details: CodeRoomDetailDto) => {
        dispatch({ type: 'SET_ROOM_DETAILS', payload: details });
    }, []);

    const setCurrentCode = useCallback((code: string) => {
        dispatch({ type: 'SET_CURRENT_CODE', payload: code });
    }, []);

    const setOriginalCode = useCallback((code: string) => {
        dispatch({ type: 'SET_ORIGINAL_CODE', payload: code });
    }, []);

    const addParticipant = useCallback((participant: ParticipantDto) => {
        dispatch({ type: 'ADD_PARTICIPANT', payload: participant });
    }, []);

    const removeParticipant = useCallback((userId: string) => {
        dispatch({ type: 'REMOVE_PARTICIPANT', payload: userId });
    }, []);

    const updateParticipant = useCallback((userId: string, updates: Partial<ParticipantDto>) => {
        dispatch({ type: 'UPDATE_PARTICIPANT', payload: { userId, updates } });
    }, []);

    const setCurrentUser = useCallback((participant: ParticipantDto | null) => {
        dispatch({ type: 'SET_CURRENT_USER', payload: participant });
    }, []);

    const cleanupDisconnectedParticipants = useCallback(() => {
        dispatch({ type: 'CLEANUP_DISCONNECTED_PARTICIPANTS' });
    }, []);

    const setConnected = useCallback((connected: boolean) => {
        dispatch({ type: 'SET_CONNECTED', payload: connected });
    }, []);

    const setConnectionError = useCallback((error: string | null) => {
        dispatch({ type: 'SET_CONNECTION_ERROR', payload: error });
    }, []);

    const setReconnecting = useCallback((reconnecting: boolean) => {
        dispatch({ type: 'SET_RECONNECTING', payload: reconnecting });
    }, []);

    const setLocalMediaState = useCallback((mediaState: Partial<MediaStateDto>) => {
        dispatch({ type: 'SET_LOCAL_MEDIA_STATE', payload: mediaState });
    }, []);

    const updateRemoteMediaState = useCallback((userId: string, mediaState: MediaStateDto) => {
        dispatch({ type: 'UPDATE_REMOTE_MEDIA_STATE', payload: { userId, state: mediaState } });
    }, []);

    const setLocalStream = useCallback((stream: MediaStream | null) => {
        dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
    }, []);

    const addRemoteStream = useCallback((userId: string, stream: MediaStream) => {
        dispatch({ type: 'ADD_REMOTE_STREAM', payload: { userId, stream } });
    }, []);

    const removeRemoteStream = useCallback((userId: string) => {
        dispatch({ type: 'REMOVE_REMOTE_STREAM', payload: userId });
    }, []);

    const updateCursor = useCallback((userId: string, position: CursorPositionDto, colorHex: string) => {
        dispatch({ type: 'UPDATE_CURSOR', payload: { userId, position, colorHex } });
    }, []);

    const removeCursor = useCallback((userId: string) => {
        dispatch({ type: 'REMOVE_CURSOR', payload: userId });
    }, []);

    const setUserTyping = useCallback((userId: string, isTyping: boolean) => {
        dispatch({ type: 'SET_USER_TYPING', payload: { userId, isTyping } });
    }, []);

    const setShowSettings = useCallback((show: boolean) => {
        dispatch({ type: 'SET_SHOW_SETTINGS', payload: show });
    }, []);

    const setShowParticipants = useCallback((show: boolean) => {
        dispatch({ type: 'SET_SHOW_PARTICIPANTS', payload: show });
    }, []);

    const setActiveView = useCallback((view: 'code' | 'video' | 'split') => {
        dispatch({ type: 'SET_ACTIVE_VIEW', payload: view });
    }, []);

    const setShowCreateRoomModal = useCallback((show: boolean) => {
        dispatch({ type: 'SET_SHOW_CREATE_ROOM_MODAL', payload: show });
    }, []);

    const setShowJoinRoomModal = useCallback((show: boolean) => {
        dispatch({ type: 'SET_SHOW_JOIN_ROOM_MODAL', payload: show });
    }, []);

    const setJoiningRoom = useCallback((joining: boolean) => {
        dispatch({ type: 'SET_JOINING_ROOM', payload: joining });
    }, []);

    const setCreatingRoom = useCallback((creating: boolean) => {
        dispatch({ type: 'SET_CREATING_ROOM', payload: creating });
    }, []);

    const setLeavingRoom = useCallback((leaving: boolean) => {
        dispatch({ type: 'SET_LEAVING_ROOM', payload: leaving });
    }, []);

    const setSyncing = useCallback((syncing: boolean) => {
        dispatch({ type: 'SET_SYNCING', payload: syncing });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    // Computed values
    const isHost = useCallback(() => {
        return state.currentUser?.role === ParticipantRole.HOST;
    }, [state.currentUser]);

    const isCollaborator = useCallback(() => {
        return state.currentUser?.role === ParticipantRole.COLLABORATOR;
    }, [state.currentUser]);

    const isViewer = useCallback(() => {
        return state.currentUser?.role === ParticipantRole.VIEWER;
    }, [state.currentUser]);

    const canEdit = useCallback(() => {
        return state.currentUser?.role === ParticipantRole.HOST ||
            state.currentUser?.role === ParticipantRole.COLLABORATOR;
    }, [state.currentUser]);

    const getActiveParticipants = useCallback(() => {
        const activeParticipants: ParticipantDto[] = [];
        state.participants.forEach(participant => {
            if (participant.status === ParticipantStatus.ACTIVE) {
                activeParticipants.push(participant);
            }
        });
        return activeParticipants;
    }, [state.participants]);

    const isParticipantActive = useCallback((userId: string) => {
        const participant = state.participants.get(userId);
        return participant?.status === ParticipantStatus.ACTIVE;
    }, [state.participants]);

    const value = useMemo(() => ({
        ...state,
        setRoom,
        setRoomDetails,
        setCurrentCode,
        setOriginalCode,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setCurrentUser,
        cleanupDisconnectedParticipants,
        setConnected,
        setConnectionError,
        setReconnecting,
        setLocalMediaState,
        updateRemoteMediaState,
        setLocalStream,
        addRemoteStream,
        removeRemoteStream,
        updateCursor,
        removeCursor,
        setUserTyping,
        setShowSettings,
        setShowParticipants,
        setActiveView,
        setShowCreateRoomModal,
        setShowJoinRoomModal,
        setJoiningRoom,
        setCreatingRoom,
        setLeavingRoom,
        setSyncing,
        reset,
        isHost,
        isCollaborator,
        isViewer,
        canEdit,
        getActiveParticipants,
        isParticipantActive
    }), [
        state,
        setRoom,
        setRoomDetails,
        setCurrentCode,
        setOriginalCode,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setCurrentUser,
        cleanupDisconnectedParticipants,
        setConnected,
        setConnectionError,
        setReconnecting,
        setLocalMediaState,
        updateRemoteMediaState,
        setLocalStream,
        addRemoteStream,
        removeRemoteStream,
        updateCursor,
        removeCursor,
        setUserTyping,
        setShowSettings,
        setShowParticipants,
        setActiveView,
        setShowCreateRoomModal,
        setShowJoinRoomModal,
        setJoiningRoom,
        setCreatingRoom,
        setLeavingRoom,
        setSyncing,
        reset,
        isHost,
        isCollaborator,
        isViewer,
        canEdit,
        getActiveParticipants,
        isParticipantActive
    ]);

    return <CodeRoomContext.Provider value={value}>{children}</CodeRoomContext.Provider>;
};

export const useCodeRoomStore = () => {
    const context = useContext(CodeRoomContext);
    if (!context) {
        throw new Error('useCodeRoomStore must be used within a CodeRoomProvider');
    }
    return context;
};

// Create a ref to hold the current state for getState functionality
let currentStateRef: CodeRoomState | null = null;

// Add getState functionality to match Zustand API
(useCodeRoomStore as any).getState = () => {
    if (!currentStateRef) {
        throw new Error('State not initialized. Make sure CodeRoomProvider is mounted.');
    }
    return currentStateRef;
};

// Export the custom hook with the same name as the Zustand store
export default useCodeRoomStore;