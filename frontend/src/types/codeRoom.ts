// Enums
export enum CodeRoomStatus {
    ACTIVE = 'ACTIVE',
    LOCKED = 'LOCKED',
    COMPLETED = 'COMPLETED',
    ABANDONED = 'ABANDONED'
}

export enum ParticipantRole {
    HOST = 'HOST',
    COLLABORATOR = 'COLLABORATOR',
    VIEWER = 'VIEWER'
}

export enum ParticipantStatus {
    ACTIVE = 'ACTIVE',
    IDLE = 'IDLE',
    DISCONNECTED = 'DISCONNECTED',
    LEFT = 'LEFT'
}

export enum LanguageId {
    js = 'js',
    cpp = 'cpp',
    rs = 'rs',
    java = 'java'
}

// Request DTOs
export interface CreateCodeRoomRequest {
    name: string;
    description?: string;
    languageId: LanguageId;
    maxParticipants: number;
    isPublic: boolean;
    allowVoiceChat: boolean;
    allowVideoChat: boolean;
    allowScreenShare: boolean;
    initialCode?: string;
}

export interface UpdateCodeRoomRequest {
    name?: string;
    description?: string;
    maxParticipants?: number;
    isPublic?: boolean;
    allowVoiceChat?: boolean;
    allowVideoChat?: boolean;
    allowScreenShare?: boolean;
}

export interface JoinCodeRoomRequest {
    roomCode: string;
}

export interface CodeChangeDto {
    userId?: string; // Set by server
    changeId?: string;
    operation: 'insert' | 'delete' | 'replace';
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    text: string;
    timestamp?: number; // Set by server
}

export interface CursorPositionDto {
    line: number;
    column: number;
    selectionStartLine?: number;
    selectionStartColumn?: number;
    selectionEndLine?: number;
    selectionEndColumn?: number;
}

export interface WebRTCSignalDto {
    type: 'offer' | 'answer' | 'ice-candidate';
    fromUserId?: string; // Set by server
    toUserId: string;
    data: any;
}

// Response DTOs
export interface CodeRoomDto {
    id: string;
    roomCode: string;
    name: string;
    description?: string;
    hostUserId: string;
    hostUsername: string;
    status: CodeRoomStatus;
    languageId: LanguageId;
    maxParticipants: number;
    currentParticipants: number;
    isPublic: boolean;
    allowVoiceChat: boolean;
    allowVideoChat: boolean;
    allowScreenShare: boolean;
    createdAt: string;
    lastActivityAt: string;
}

export interface CodeRoomDetailDto {
    room: CodeRoomDto;
    currentCode: string;
    participants: ParticipantDto[];
    currentSession: SessionInfoDto;
    webrtcConfig: WebRTCConfigDto;
}

export interface ParticipantDto {
    id: string;
    userId: string;
    username: string;
    profilePicture?: string;
    role: ParticipantRole;
    status: ParticipantStatus;
    joinedAt: string;
    colorHex: string;
    isTyping: boolean;
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
    cursorPosition?: CursorPositionDto;
}

export interface WebRTCConfigDto {
    iceServers: string[];
    stunServer: string;
    turnServer?: string;
    turnUsername?: string;
    turnCredential?: string;
}

export interface SessionInfoDto {
    id: string;
    startedAt: string;
    durationMinutes: number;
    totalEdits: number;
    participantsCount: number;
}

// WebSocket Event Types
export interface ParticipantJoinedEvent {
    participant: ParticipantDto;
}

export interface ParticipantLeftEvent {
    userId: string;
}

export interface ParticipantStatusChangeEvent {
    userId: string;
    newStatus: ParticipantStatus;
}

export interface ParticipantRoleChangedEvent {
    userId: string;
    oldRole: ParticipantRole;
    newRole: ParticipantRole;
}

// Room Events
export interface RoomClosedEvent {
    roomId: string;
}

export interface RoomDeletedEvent {
    roomId: string;
    message: string;
}

export interface RoomSettingsUpdatedEvent {
    room: CodeRoomDto;
}

// User Activity Events
export interface UserTypingEvent {
    userId: string;
    isTyping: boolean;
}

export interface UserMediaStateEvent {
    userId: string;
    mediaState: MediaStateDto;
}

export interface CursorUpdateEvent {
    userId: string;
    position: CursorPositionDto;
    colorHex: string;
}

// Personal Events
export interface ParticipantKickedEvent {
    roomId: string;
    message: string;
}

// Sync Response
export interface CodeRoomSyncResponse {
    roomId: string;
    currentCode: string;
    participants: ParticipantDto[];
}

// Error Message
export interface ErrorMessage {
    error: string;
}

// Media State
export interface MediaStateDto {
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
}

// Page Response for pagination
export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}