import { Client, IMessage } from "@stomp/stompjs";
import SockJS from 'sockjs-client';
import {
    CodeChangeDto,
    CursorPositionDto,
    WebRTCSignalDto,
    MediaStateDto,
    ParticipantJoinedEvent,
    ParticipantLeftEvent,
    ParticipantStatusChangeEvent,
    ParticipantRoleChangedEvent,
    RoomClosedEvent,
    RoomDeletedEvent,
    RoomSettingsUpdatedEvent,
    UserTypingEvent,
    UserMediaStateEvent,
    CursorUpdateEvent,
    CodeSubmittedEvent,
    ParticipantKickedEvent,
    CodeRoomSyncResponse,
    ErrorMessage
} from '../types/codeRoom';

type EventCallback<T> = (data: T) => void;

class CodeRoomWebSocketService {
    private client: Client | null = null;
    private roomId: string | null = null;
    private baseUrl: string;
    // @ts-ignore
    private token: string | null = null;
    private subscriptions: { [key: string]: { unsubscribe: () => void } } = {};
    private connectionPromise: Promise<void> | null = null;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    }

    /**
     * Connect to WebSocket server for a specific room
     * @param roomId - The ID of the room to connect to
     * @param token - JWT token for authentication (sent as Authorization header)
     */
    async connect(roomId: string, token: string): Promise<void> {
        if (this.client && this.roomId === roomId) {
            // Already connected to the same room
            return this.connectionPromise || Promise.resolve();
        }

        // Disconnect from previous room if any
        if (this.client) {
            await this.disconnect();
        }

        this.roomId = roomId;
        this.token = token;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.client = new Client({
                webSocketFactory: () => new SockJS(`${this.baseUrl}/ws`),
                connectHeaders: {
                    // Token is used for authentication during WebSocket handshake
                    // Backend will validate this JWT token to authorize the connection
                    'Authorization': `Bearer ${token}`
                },
                debug: (str) => {
                    console.log('[CodeRoom WS]', str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = () => {
                console.log('Connected to CodeRoom WebSocket');
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error('CodeRoom WebSocket error:', frame);
                reject(new Error(frame.headers['message'] || 'WebSocket connection failed'));
            };

            this.client.onDisconnect = () => {
                console.log('Disconnected from CodeRoom WebSocket');
            };

            this.client.activate();
        });

        return this.connectionPromise;
    }

    /**
     * Disconnect from WebSocket server
     */
    async disconnect(): Promise<void> {
        if (this.client) {
            // Unsubscribe from all subscriptions
            Object.values(this.subscriptions).forEach(sub => sub.unsubscribe());
            this.subscriptions = {};

            await this.client.deactivate();
            this.client = null;
            this.roomId = null;
            this.connectionPromise = null;
        }
    }

    /**
     * Ensure connection is established
     */
    private async ensureConnected(): Promise<void> {
        if (!this.connectionPromise) {
            throw new Error('WebSocket not connected. Call connect() first.');
        }
        await this.connectionPromise;
    }

    // ============ Send Methods ============

    /**
     * Send code changes
     */
    async sendCodeChange(change: CodeChangeDto): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/code`,
            body: JSON.stringify(change),
        });
    }

    /**
     * Send cursor position
     */
    async sendCursorPosition(position: CursorPositionDto): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/cursor`,
            body: JSON.stringify(position),
        });
    }

    /**
     * Send typing status
     */
    async sendTypingStatus(isTyping: boolean): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/typing`,
            body: JSON.stringify({ typing: isTyping }),
        });
    }

    /**
     * Send WebRTC signal
     */
    async sendWebRTCSignal(signal: WebRTCSignalDto): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/webrtc/signal`,
            body: JSON.stringify(signal),
        });
    }

    /**
     * Send media state change
     */
    async sendMediaState(mediaState: MediaStateDto): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/webrtc/media-state`,
            body: JSON.stringify(mediaState),
        });
    }

    /**
     * Request sync
     */
    async requestSync(): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        this.client.publish({
            destination: `/app/coderoom/${this.roomId}/sync`,
            body: '{}',
        });
    }

    // ============ Subscribe Methods ============

    /**
     * Subscribe to code changes
     */
    async onCodeChange(callback: EventCallback<CodeChangeDto>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/code`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as CodeChangeDto;
                callback(data);
            }
        );
        this.subscriptions['code'] = subscription;
    }

    /**
     * Subscribe to cursor updates
     */
    async onCursorUpdate(callback: EventCallback<CursorUpdateEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/cursors`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as CursorUpdateEvent;
                callback(data);
            }
        );
        this.subscriptions['cursors'] = subscription;
    }

    /**
     * Subscribe to participant joined events
     */
    async onParticipantJoined(callback: EventCallback<ParticipantJoinedEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/participants`,
            (message: IMessage) => {
                const data = JSON.parse(message.body);
                if (data.participant) {
                    callback(data as ParticipantJoinedEvent);
                }
            }
        );
        this.subscriptions['participant-joined'] = subscription;
    }

    /**
     * Subscribe to participant left events
     */
    async onParticipantLeft(callback: EventCallback<ParticipantLeftEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/participants`,
            (message: IMessage) => {
                const data = JSON.parse(message.body);
                if (data.userId && !data.participant && !data.newStatus && !data.newRole) {
                    callback(data as ParticipantLeftEvent);
                }
            }
        );
        this.subscriptions['participant-left'] = subscription;
    }

    /**
     * Subscribe to participant status change events
     */
    async onParticipantStatusChange(callback: EventCallback<ParticipantStatusChangeEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/participants`,
            (message: IMessage) => {
                const data = JSON.parse(message.body);
                if (data.userId && data.newStatus) {
                    callback(data as ParticipantStatusChangeEvent);
                }
            }
        );
        this.subscriptions['participant-status'] = subscription;
    }

    /**
     * Subscribe to participant role change events
     */
    async onParticipantRoleChange(callback: EventCallback<ParticipantRoleChangedEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/participants`,
            (message: IMessage) => {
                const data = JSON.parse(message.body);
                if (data.userId && data.newRole && data.oldRole) {
                    callback(data as ParticipantRoleChangedEvent);
                }
            }
        );
        this.subscriptions['participant-role'] = subscription;
    }

    /**
     * Subscribe to all participant events with a single subscription
     * This is more efficient than multiple subscriptions to the same topic
     */
    async onParticipantEvents(callbacks: {
        onJoined?: EventCallback<ParticipantJoinedEvent>;
        onLeft?: EventCallback<ParticipantLeftEvent>;
        onStatusChange?: EventCallback<ParticipantStatusChangeEvent>;
        onRoleChange?: EventCallback<ParticipantRoleChangedEvent>;
    }): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/participants`,
            (message: IMessage) => {
                const data = JSON.parse(message.body);

                // Determine event type and call appropriate callback
                if (data.participant) {
                    callbacks.onJoined?.(data as ParticipantJoinedEvent);
                } else if (data.userId && !data.participant && !data.newStatus && !data.newRole) {
                    callbacks.onLeft?.(data as ParticipantLeftEvent);
                } else if (data.userId && data.newStatus) {
                    callbacks.onStatusChange?.(data as ParticipantStatusChangeEvent);
                } else if (data.userId && data.newRole && data.oldRole) {
                    callbacks.onRoleChange?.(data as ParticipantRoleChangedEvent);
                }
            }
        );
        this.subscriptions['participant-events'] = subscription;
    }

    /**
     * Subscribe to typing indicators
     */
    async onTypingIndicator(callback: EventCallback<UserTypingEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/typing`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as UserTypingEvent;
                callback(data);
            }
        );
        this.subscriptions['typing'] = subscription;
    }

    /**
     * Subscribe to media state changes
     */
    async onMediaStateChange(callback: EventCallback<UserMediaStateEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/media-state`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as UserMediaStateEvent;
                callback(data);
            }
        );
        this.subscriptions['media-state'] = subscription;
    }

    /**
     * Subscribe to room status updates
     */
    async onRoomStatusUpdate(
        callback: EventCallback<RoomClosedEvent | RoomDeletedEvent>
    ): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/status`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as RoomClosedEvent | RoomDeletedEvent;
                callback(data);
            }
        );
        this.subscriptions['room-status'] = subscription;
    }

    /**
     * Subscribe to room settings updates
     */
    async onRoomSettingsUpdate(callback: EventCallback<RoomSettingsUpdatedEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/settings`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as RoomSettingsUpdatedEvent;
                callback(data);
            }
        );
        this.subscriptions['room-settings'] = subscription;
    }

    /**
     * Subscribe to submission notifications
     */
    async onCodeSubmitted(callback: EventCallback<CodeSubmittedEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/topic/coderoom/${this.roomId}/submission`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as CodeSubmittedEvent;
                callback(data);
            }
        );
        this.subscriptions['submission'] = subscription;
    }

    // ============ Personal Queue Subscriptions ============

    /**
     * Subscribe to WebRTC signals
     */
    async onWebRTCSignal(callback: EventCallback<WebRTCSignalDto>): Promise<void> {
        await this.ensureConnected();
        if (!this.client || !this.roomId) return;

        const subscription = this.client.subscribe(
            `/user/queue/coderoom/${this.roomId}/webrtc`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as WebRTCSignalDto;
                callback(data);
            }
        );
        this.subscriptions['webrtc-signal'] = subscription;
    }

    /**
     * Subscribe to kicked notifications
     */
    async onKicked(callback: EventCallback<ParticipantKickedEvent>): Promise<void> {
        await this.ensureConnected();
        if (!this.client) return;

        const subscription = this.client.subscribe(
            `/user/queue/coderoom/kicked`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as ParticipantKickedEvent;
                callback(data);
            }
        );
        this.subscriptions['kicked'] = subscription;
    }

    /**
     * Subscribe to sync responses
     */
    async onSyncResponse(callback: EventCallback<CodeRoomSyncResponse>): Promise<void> {
        await this.ensureConnected();
        if (!this.client) return;

        const subscription = this.client.subscribe(
            `/user/queue/coderoom/sync-response`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as CodeRoomSyncResponse;
                callback(data);
            }
        );
        this.subscriptions['sync-response'] = subscription;
    }

    /**
     * Subscribe to error messages
     */
    async onError(callback: EventCallback<ErrorMessage>): Promise<void> {
        await this.ensureConnected();
        if (!this.client) return;

        const subscription = this.client.subscribe(
            `/user/queue/errors`,
            (message: IMessage) => {
                const data = JSON.parse(message.body) as ErrorMessage;
                callback(data);
            }
        );
        this.subscriptions['errors'] = subscription;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return !!this.client && this.client.connected;
    }

    /**
     * Get current room ID
     */
    getCurrentRoomId(): string | null {
        return this.roomId;
    }
}

// Create a singleton instance
const codeRoomWebSocketService = new CodeRoomWebSocketService();
export default codeRoomWebSocketService;