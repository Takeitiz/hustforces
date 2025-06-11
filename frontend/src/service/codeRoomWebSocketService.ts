import { Client, type IMessage } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import type {
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
    ErrorMessage,
} from "../types/codeRoom"

type EventCallback<T> = (data: T) => void

interface ConnectionOptions {
    roomId: string
    token: string
    onAuthError?: () => void
    onConnectionError?: (error: Error) => void
    onReconnect?: () => void
}

class CodeRoomWebSocketService {
    private client: Client | null = null
    private roomId: string | null = null
    private baseUrl: string
    private token: string | null = null
    private subscriptions: { [key: string]: { unsubscribe: () => void } } = {}
    private connectionPromise: Promise<void> | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private onAuthError?: () => void
    private onConnectionError?: (error: Error) => void
    private onReconnect?: () => void

    constructor() {
        this.baseUrl = import.meta.env.VITE_SOCKET || "http://localhost:8080"
    }

    /**
     * Validate JWT token format and expiration
     */
    private validateToken(token: string): boolean {
        if (!token || typeof token !== "string") {
            console.error("[CodeRoom WS] Invalid token: Token is null or not a string")
            return false
        }

        try {
            // Basic JWT format validation (header.payload.signature)
            const parts = token.split(".")
            if (parts.length !== 3) {
                console.error("[CodeRoom WS] Invalid token: Not a valid JWT format")
                return false
            }

            // Decode payload to check expiration
            const payload = JSON.parse(atob(parts[1]))
            const currentTime = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp < currentTime) {
                console.error("[CodeRoom WS] Invalid token: Token has expired")
                return false
            }

            return true
        } catch (error) {
            console.error("[CodeRoom WS] Invalid token: Failed to parse JWT", error)
            return false
        }
    }

    /**
     * Get fresh token from localStorage or auth service
     */
    private getFreshToken(): string | null {
        const token = localStorage.getItem("token")
        if (!token) {
            console.error("[CodeRoom WS] No token found in localStorage")
            return null
        }

        if (!this.validateToken(token)) {
            console.error("[CodeRoom WS] Token validation failed")
            // Clear invalid token
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            return null
        }

        return token
    }

    /**
     * Connect to WebSocket server for a specific room
     */
    async connect(options: ConnectionOptions | string, legacyToken?: string): Promise<void> {
        // Handle both new object-based and legacy string-based parameters
        let roomId: string
        let token: string
        let callbacks: Partial<ConnectionOptions> = {}

        if (typeof options === "string") {
            // Legacy support
            roomId = options
            token = legacyToken || ""
            console.warn("[CodeRoom WS] Using legacy connect method. Consider using the new object-based approach.")
        } else {
            roomId = options.roomId
            token = options.token
            callbacks = {
                onAuthError: options.onAuthError,
                onConnectionError: options.onConnectionError,
                onReconnect: options.onReconnect,
            }
        }

        // Validate inputs
        if (!roomId || typeof roomId !== "string") {
            throw new Error("Room ID is required and must be a string")
        }

        // Get fresh token if not provided or invalid
        const validToken = token && this.validateToken(token) ? token : this.getFreshToken()

        if (!validToken) {
            const error = new Error("Valid JWT token is required for WebSocket connection")
            callbacks.onAuthError?.()
            throw error
        }

        // Store callbacks
        this.onAuthError = callbacks.onAuthError
        this.onConnectionError = callbacks.onConnectionError
        this.onReconnect = callbacks.onReconnect

        // Check if already connected to the same room with the same token
        if (this.client && this.roomId === roomId && this.token === validToken && this.client.connected) {
            console.log("[CodeRoom WS] Already connected to the same room with valid token")
            return this.connectionPromise || Promise.resolve()
        }

        // Disconnect from previous room if any
        if (this.client) {
            console.log("[CodeRoom WS] Disconnecting from previous room")
            await this.disconnect()
        }

        this.roomId = roomId
        this.token = validToken
        this.reconnectAttempts = 0

        console.log("[CodeRoom WS] Initiating connection to room:", roomId)

        this.connectionPromise = new Promise((resolve, reject) => {
            this.client = new Client({
                webSocketFactory: () => {
                    const socketUrl = `${this.baseUrl}/ws`
                    console.log("[CodeRoom WS] Creating WebSocket connection to:", socketUrl)
                    return new SockJS(socketUrl)
                },
                connectHeaders: {
                    // JWT token for authentication during WebSocket handshake
                    Authorization: `Bearer ${validToken}`,
                    // Additional headers for better compatibility
                    "X-Room-Id": roomId,
                    "Content-Type": "application/json",
                },
                debug: (str) => {
                    // Only log important debug messages to avoid spam
                    if (str.includes("CONNECT") || str.includes("ERROR") || str.includes("DISCONNECT")) {
                        console.log("[CodeRoom WS Debug]", str)
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            })

            this.client.onConnect = (frame) => {
                console.log("[CodeRoom WS] Successfully connected to room:", roomId)
                console.log("[CodeRoom WS] Connection frame:", frame)
                this.reconnectAttempts = 0
                this.onReconnect?.()
                resolve()
            }

            this.client.onStompError = (frame) => {
                console.error("[CodeRoom WS] STOMP error:", frame)
                const errorMessage = frame.headers["message"] || "WebSocket connection failed"
                const error = new Error(errorMessage)

                // Check if it's an authentication error
                if (
                    errorMessage.toLowerCase().includes("unauthorized") ||
                    errorMessage.toLowerCase().includes("authentication") ||
                    errorMessage.toLowerCase().includes("token")
                ) {
                    console.error("[CodeRoom WS] Authentication error detected")
                    this.onAuthError?.()
                }

                this.onConnectionError?.(error)
                reject(error)
            }

            this.client.onWebSocketError = (event) => {
                console.error("[CodeRoom WS] WebSocket error:", event)
                const error = new Error("WebSocket connection error")
                this.onConnectionError?.(error)
                reject(error)
            }

            this.client.onDisconnect = (frame) => {
                console.log("[CodeRoom WS] Disconnected from WebSocket")
                console.log("[CodeRoom WS] Disconnect frame:", frame)

                // Attempt reconnection if not manually disconnected
                if (this.reconnectAttempts < this.maxReconnectAttempts && this.roomId && this.token) {
                    this.reconnectAttempts++
                    console.log(`[CodeRoom WS] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

                    setTimeout(() => {
                        this.attemptReconnection()
                    }, 5000 * this.reconnectAttempts) // Exponential backoff
                }
            }

            // Activate the connection
            try {
                this.client.activate()
            } catch (error) {
                console.error("[CodeRoom WS] Failed to activate client:", error)
                reject(error)
            }
        })

        return this.connectionPromise
    }

    /**
     * Attempt to reconnect with fresh token
     */
    private async attemptReconnection(): Promise<void> {
        if (!this.roomId) return

        try {
            console.log("[CodeRoom WS] Attempting reconnection...")

            // Get fresh token for reconnection
            const freshToken = this.getFreshToken()
            if (!freshToken) {
                console.error("[CodeRoom WS] Cannot reconnect: No valid token available")
                this.onAuthError?.()
                return
            }

            // Reconnect with fresh token
            await this.connect({
                roomId: this.roomId,
                token: freshToken,
                onAuthError: this.onAuthError,
                onConnectionError: this.onConnectionError,
                onReconnect: this.onReconnect,
            })

            console.log("[CodeRoom WS] Reconnection successful")
        } catch (error) {
            console.error("[CodeRoom WS] Reconnection failed:", error)
            this.onConnectionError?.(error as Error)
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    async disconnect(): Promise<void> {
        console.log("[CodeRoom WS] Initiating disconnect")

        if (this.client) {
            // Unsubscribe from all subscriptions
            Object.keys(this.subscriptions).forEach((key) => {
                try {
                    this.subscriptions[key].unsubscribe()
                } catch (error) {
                    console.warn(`[CodeRoom WS] Error unsubscribing from ${key}:`, error)
                }
            })
            this.subscriptions = {}

            // Deactivate client
            try {
                await this.client.deactivate()
            } catch (error) {
                console.warn("[CodeRoom WS] Error during client deactivation:", error)
            }

            this.client = null
        }

        this.roomId = null
        this.token = null
        this.connectionPromise = null
        this.reconnectAttempts = 0

        console.log("[CodeRoom WS] Disconnect complete")
    }

    /**
     * Ensure connection is established and token is valid
     */
    private async ensureConnected(): Promise<void> {
        if (!this.connectionPromise) {
            throw new Error("WebSocket not connected. Call connect() first.")
        }

        // Verify token is still valid
        if (this.token && !this.validateToken(this.token)) {
            console.warn("[CodeRoom WS] Token expired, attempting reconnection with fresh token")

            const freshToken = this.getFreshToken()
            if (!freshToken || !this.roomId) {
                throw new Error("Cannot maintain connection: Invalid or expired token")
            }

            // Reconnect with fresh token
            await this.connect({
                roomId: this.roomId,
                token: freshToken,
                onAuthError: this.onAuthError,
                onConnectionError: this.onConnectionError,
                onReconnect: this.onReconnect,
            })
        }

        await this.connectionPromise
    }

    // ============ Send Methods ============

    /**
     * Send code changes
     */
    async sendCodeChange(change: CodeChangeDto): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/code`,
                body: JSON.stringify(change),
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error sending code change:", error)
            throw error
        }
    }

    /**
     * Send cursor position
     */
    async sendCursorPosition(position: CursorPositionDto): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/cursor`,
                body: JSON.stringify(position),
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error sending cursor position:", error)
            throw error
        }
    }

    /**
     * Send typing status
     */
    async sendTypingStatus(isTyping: boolean): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/typing`,
                body: JSON.stringify({ typing: isTyping }),
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error sending typing status:", error)
            throw error
        }
    }

    /**
     * Send WebRTC signal
     */
    async sendWebRTCSignal(signal: WebRTCSignalDto): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/webrtc/signal`,
                body: JSON.stringify(signal),
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error sending WebRTC signal:", error)
            throw error
        }
    }

    /**
     * Send media state change
     */
    async sendMediaState(mediaState: MediaStateDto): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/webrtc/media-state`,
                body: JSON.stringify(mediaState),
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error sending media state:", error)
            throw error
        }
    }

    /**
     * Request sync
     */
    async requestSync(): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        try {
            this.client.publish({
                destination: `/app/coderoom/${this.roomId}/sync`,
                body: "{}",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            })
        } catch (error) {
            console.error("[CodeRoom WS] Error requesting sync:", error)
            throw error
        }
    }

    // ============ Subscribe Methods ============

    /**
     * Subscribe to code changes
     */
    async onCodeChange(callback: EventCallback<CodeChangeDto>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/code`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as CodeChangeDto
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing code change message:", error)
            }
        })
        this.subscriptions["code"] = subscription
    }

    /**
     * Subscribe to cursor updates
     */
    async onCursorUpdate(callback: EventCallback<CursorUpdateEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/cursors`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as CursorUpdateEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing cursor update message:", error)
            }
        })
        this.subscriptions["cursors"] = subscription
    }

    /**
     * Subscribe to all participant events with a single subscription
     */
    async onParticipantEvents(callbacks: {
        onJoined?: EventCallback<ParticipantJoinedEvent>
        onLeft?: EventCallback<ParticipantLeftEvent>
        onStatusChange?: EventCallback<ParticipantStatusChangeEvent>
        onRoleChange?: EventCallback<ParticipantRoleChangedEvent>
    }): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/participants`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body)

                // Determine event type and call appropriate callback
                if (data.participant) {
                    callbacks.onJoined?.(data as ParticipantJoinedEvent)
                } else if (data.userId && !data.participant && !data.newStatus && !data.newRole) {
                    callbacks.onLeft?.(data as ParticipantLeftEvent)
                } else if (data.userId && data.newStatus) {
                    callbacks.onStatusChange?.(data as ParticipantStatusChangeEvent)
                } else if (data.userId && data.newRole && data.oldRole) {
                    callbacks.onRoleChange?.(data as ParticipantRoleChangedEvent)
                }
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing participant event message:", error)
            }
        })
        this.subscriptions["participant-events"] = subscription
    }

    /**
     * Subscribe to typing indicators
     */
    async onTypingIndicator(callback: EventCallback<UserTypingEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/typing`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as UserTypingEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing typing indicator message:", error)
            }
        })
        this.subscriptions["typing"] = subscription
    }

    /**
     * Subscribe to media state changes
     */
    async onMediaStateChange(callback: EventCallback<UserMediaStateEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/media-state`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as UserMediaStateEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing media state message:", error)
            }
        })
        this.subscriptions["media-state"] = subscription
    }

    /**
     * Subscribe to room status updates
     */
    async onRoomStatusUpdate(callback: EventCallback<RoomClosedEvent | RoomDeletedEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/status`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as RoomClosedEvent | RoomDeletedEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing room status message:", error)
            }
        })
        this.subscriptions["room-status"] = subscription
    }

    /**
     * Subscribe to room settings updates
     */
    async onRoomSettingsUpdate(callback: EventCallback<RoomSettingsUpdatedEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/settings`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as RoomSettingsUpdatedEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing room settings message:", error)
            }
        })
        this.subscriptions["room-settings"] = subscription
    }

    /**
     * Subscribe to submission notifications
     */
    async onCodeSubmitted(callback: EventCallback<CodeSubmittedEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/topic/coderoom/${this.roomId}/submission`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as CodeSubmittedEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing code submission message:", error)
            }
        })
        this.subscriptions["submission"] = subscription
    }

    // ============ Personal Queue Subscriptions ============

    /**
     * Subscribe to WebRTC signals
     */
    async onWebRTCSignal(callback: EventCallback<WebRTCSignalDto>): Promise<void> {
        await this.ensureConnected()
        if (!this.client || !this.roomId) return

        const subscription = this.client.subscribe(`/user/queue/coderoom/${this.roomId}/webrtc`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as WebRTCSignalDto
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing WebRTC signal message:", error)
            }
        })
        this.subscriptions["webrtc-signal"] = subscription
    }

    /**
     * Subscribe to kicked notifications
     */
    async onKicked(callback: EventCallback<ParticipantKickedEvent>): Promise<void> {
        await this.ensureConnected()
        if (!this.client) return

        const subscription = this.client.subscribe(`/user/queue/coderoom/kicked`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as ParticipantKickedEvent
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing kicked notification message:", error)
            }
        })
        this.subscriptions["kicked"] = subscription
    }

    /**
     * Subscribe to sync responses
     */
    async onSyncResponse(callback: EventCallback<CodeRoomSyncResponse>): Promise<void> {
        await this.ensureConnected()
        if (!this.client) return

        const subscription = this.client.subscribe(`/user/queue/coderoom/sync-response`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as CodeRoomSyncResponse
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing sync response message:", error)
            }
        })
        this.subscriptions["sync-response"] = subscription
    }

    /**
     * Subscribe to error messages
     */
    async onError(callback: EventCallback<ErrorMessage>): Promise<void> {
        await this.ensureConnected()
        if (!this.client) return

        const subscription = this.client.subscribe(`/user/queue/errors`, (message: IMessage) => {
            try {
                const data = JSON.parse(message.body) as ErrorMessage
                callback(data)
            } catch (error) {
                console.error("[CodeRoom WS] Error parsing error message:", error)
            }
        })
        this.subscriptions["errors"] = subscription
    }

    // ============ Utility Methods ============

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return !!this.client && this.client.connected
    }

    /**
     * Get current room ID
     */
    getCurrentRoomId(): string | null {
        return this.roomId
    }

    /**
     * Get connection status information
     */
    getConnectionStatus(): {
        connected: boolean
        roomId: string | null
        hasValidToken: boolean
        reconnectAttempts: number
    } {
        return {
            connected: this.isConnected(),
            roomId: this.roomId,
            hasValidToken: !!this.token && this.validateToken(this.token),
            reconnectAttempts: this.reconnectAttempts,
        }
    }

    /**
     * Force reconnection with fresh token
     */
    async forceReconnect(): Promise<void> {
        if (!this.roomId) {
            throw new Error("Cannot reconnect: No room ID available")
        }

        const freshToken = this.getFreshToken()
        if (!freshToken) {
            throw new Error("Cannot reconnect: No valid token available")
        }

        await this.connect({
            roomId: this.roomId,
            token: freshToken,
            onAuthError: this.onAuthError,
            onConnectionError: this.onConnectionError,
            onReconnect: this.onReconnect,
        })
    }
}

// Create a singleton instance
const codeRoomWebSocketService = new CodeRoomWebSocketService()
export default codeRoomWebSocketService
