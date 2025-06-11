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
import { performanceMonitor } from "../utils/performance"
import { debugLog, debugError, debugWarn } from "../utils/debug"

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

    // New properties for better connection management
    private isConnecting: boolean = false
    private connectionTimeout: NodeJS.Timeout | null = null

    constructor() {
        this.baseUrl = import.meta.env.VITE_SOCKET || "http://localhost:8080"
        debugLog("WEBSOCKET", "WebSocket service initialized with base URL:", this.baseUrl)
    }

    /**
     * Validate JWT token format and expiration
     */
    private validateToken(token: string): boolean {
        if (!token || typeof token !== "string") {
            debugError("WEBSOCKET", "Invalid token: Token is null or not a string")
            return false
        }

        try {
            // Basic JWT format validation (header.payload.signature)
            const parts = token.split(".")
            if (parts.length !== 3) {
                debugError("WEBSOCKET", "Invalid token: Not a valid JWT format")
                return false
            }

            // Decode payload to check expiration
            const payload = JSON.parse(atob(parts[1]))
            const currentTime = Math.floor(Date.now() / 1000)

            if (payload.exp && payload.exp < currentTime) {
                debugError("WEBSOCKET", "Invalid token: Token has expired")
                return false
            }

            return true
        } catch (error) {
            debugError("WEBSOCKET", "Invalid token: Failed to parse JWT", error)
            return false
        }
    }

    /**
     * Get fresh token from localStorage or auth service
     */
    private getFreshToken(): string | null {
        const token = localStorage.getItem("token")
        if (!token) {
            debugError("WEBSOCKET", "No token found in localStorage")
            return null
        }

        if (!this.validateToken(token)) {
            debugError("WEBSOCKET", "Token validation failed")
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
    async connect(options: ConnectionOptions): Promise<void> {
        debugLog("WEBSOCKET", "Connect request received:", { roomId: options.roomId })

        // Prevent duplicate connections
        if (this.isConnecting) {
            debugWarn("WEBSOCKET", "Connection already in progress")
            return this.connectionPromise || Promise.reject(new Error("Connection in progress"))
        }

        // Check if already connected to the same room
        if (this.client?.connected && this.roomId === options.roomId && this.token === options.token) {
            debugLog("WEBSOCKET", "Already connected to room")
            return Promise.resolve()
        }

        // Validate inputs
        if (!options.roomId || !options.token) {
            throw new Error("Room ID and token are required")
        }

        // Validate token
        if (!this.validateToken(options.token)) {
            debugError("WEBSOCKET", "Invalid token provided")
            options.onAuthError?.()
            throw new Error("Invalid authentication token")
        }

        // Disconnect from previous room if any
        if (this.client) {
            debugLog("WEBSOCKET", "Disconnecting from previous room")
            await this.disconnect()
        }

        // Store connection parameters
        this.roomId = options.roomId
        this.token = options.token
        this.onAuthError = options.onAuthError
        this.onConnectionError = options.onConnectionError
        this.onReconnect = options.onReconnect
        this.isConnecting = true
        this.reconnectAttempts = 0

        // Start performance monitoring
        performanceMonitor.startTimer("websocket_connection")

        // Create connection promise
        this.connectionPromise = new Promise((resolve, reject) => {
            // Set connection timeout
            this.connectionTimeout = setTimeout(() => {
                this.isConnecting = false
                performanceMonitor.endTimer("websocket_connection", { status: "timeout" })
                const error = new Error("WebSocket connection timeout (10s)")
                debugError("WEBSOCKET", "Connection timeout reached")
                this.onConnectionError?.(error)
                reject(error)
            }, 10000)

            try {
                debugLog("WEBSOCKET", "Creating STOMP client")

                // Create STOMP client with heartbeats disabled
                this.client = new Client({
                    webSocketFactory: () => {
                        const socketUrl = `${this.baseUrl}/ws`
                        debugLog("WEBSOCKET", "Creating WebSocket connection to:", socketUrl)

                        return new SockJS(socketUrl, null, {
                            timeout: 5000,
                            transports: ['websocket', 'xhr-streaming', 'xhr-polling']
                        })
                    },
                    connectHeaders: {
                        Authorization: `Bearer ${this.token}`,
                        "X-Client-Version": "1.0.0",
                        "X-Client-Type": "web"
                    },
                    debug: (str) => {
                        if (str.includes("CONNECT") ||
                            str.includes("ERROR") ||
                            str.includes("DISCONNECT") ||
                            str.includes("CONNECTED")) {
                            debugLog("WEBSOCKET", "STOMP Debug:", str)
                        }
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 0,  // Disable incoming heartbeats
                    heartbeatOutgoing: 0,  // Disable outgoing heartbeats
                    connectionTimeout: 5000,
                })

                // Handle successful connection
                this.client.onConnect = (frame) => {
                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout)
                        this.connectionTimeout = null
                    }

                    this.isConnecting = false
                    this.reconnectAttempts = 0

                    performanceMonitor.endTimer("websocket_connection", { status: "success" })

                    debugLog("WEBSOCKET", "Connected successfully")
                    debugLog("WEBSOCKET", "Session ID:", frame.headers['session'])
                    debugLog("WEBSOCKET", "Server:", frame.headers['server'])

                    this.onReconnect?.()
                    resolve()
                }

                // Handle STOMP errors
                this.client.onStompError = (frame) => {
                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout)
                        this.connectionTimeout = null
                    }

                    this.isConnecting = false

                    const errorMessage = frame.headers['message'] || 'WebSocket STOMP error'
                    debugError("WEBSOCKET", "STOMP error:", errorMessage, frame)

                    performanceMonitor.endTimer("websocket_connection", {
                        status: "stomp_error",
                        error: errorMessage
                    })

                    const error = new Error(errorMessage)

                    // Check for auth errors
                    if (errorMessage.toLowerCase().includes('unauthorized') ||
                        errorMessage.toLowerCase().includes('authentication') ||
                        errorMessage.toLowerCase().includes('token')) {
                        debugError("WEBSOCKET", "Authentication error detected")
                        this.onAuthError?.()
                    }

                    this.onConnectionError?.(error)
                    reject(error)
                }

                // Handle WebSocket errors
                this.client.onWebSocketError = (event) => {
                    if (this.connectionTimeout) {
                        clearTimeout(this.connectionTimeout)
                        this.connectionTimeout = null
                    }

                    this.isConnecting = false

                    debugError("WEBSOCKET", "WebSocket error:", event)
                    performanceMonitor.endTimer("websocket_connection", {
                        status: "websocket_error"
                    })

                    const error = new Error("WebSocket connection failed")
                    this.onConnectionError?.(error)
                    reject(error)
                }

                // Handle disconnection
                this.client.onDisconnect = (frame) => {
                    this.isConnecting = false

                    debugLog("WEBSOCKET", "Disconnected", frame)

                    // Only attempt reconnect if we were previously connected
                    if (this.reconnectAttempts < this.maxReconnectAttempts &&
                        this.roomId &&
                        this.token &&
                        !frame.headers['planned']) {

                        this.reconnectAttempts++
                        debugLog("WEBSOCKET", `Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

                        setTimeout(() => {
                            this.attemptReconnection()
                        }, 2000 * this.reconnectAttempts)
                    }
                }

                // Activate the client
                debugLog("WEBSOCKET", "Activating STOMP client")
                this.client.activate()

            } catch (error) {
                if (this.connectionTimeout) {
                    clearTimeout(this.connectionTimeout)
                    this.connectionTimeout = null
                }

                this.isConnecting = false
                performanceMonitor.endTimer("websocket_connection", {
                    status: "error",
                    error: (error as Error).message
                })

                debugError("WEBSOCKET", "Failed to create client:", error)
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
            debugLog("WEBSOCKET", "Attempting reconnection...")

            // Get fresh token for reconnection
            const freshToken = this.getFreshToken()
            if (!freshToken) {
                debugError("WEBSOCKET", "Cannot reconnect: No valid token available")
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

            debugLog("WEBSOCKET", "Reconnection successful")
        } catch (error) {
            debugError("WEBSOCKET", "Reconnection failed:", error)
            this.onConnectionError?.(error as Error)
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    async disconnect(): Promise<void> {
        debugLog("WEBSOCKET", "Initiating disconnect")

        // Clear any timeouts
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout)
            this.connectionTimeout = null
        }

        // Unsubscribe from all subscriptions
        Object.keys(this.subscriptions).forEach((key) => {
            try {
                this.subscriptions[key].unsubscribe()
            } catch (error) {
                debugWarn("WEBSOCKET", `Error unsubscribing from ${key}:`, error)
            }
        })
        this.subscriptions = {}

        // Deactivate client
        if (this.client) {
            try {
                // Force disconnect first to ensure clean shutdown
                this.client.forceDisconnect()
                await this.client.deactivate()
            } catch (error) {
                debugWarn("WEBSOCKET", "Error during client deactivation:", error)
            }
            this.client = null
        }

        // Reset state
        this.isConnecting = false
        this.connectionPromise = null
        this.roomId = null
        this.token = null
        this.reconnectAttempts = 0

        debugLog("WEBSOCKET", "Disconnect complete")
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
            debugWarn("WEBSOCKET", "Token expired, attempting reconnection with fresh token")

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
            debugError("WEBSOCKET", "Error sending code change:", error)
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
            debugError("WEBSOCKET", "Error sending cursor position:", error)
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
            debugError("WEBSOCKET", "Error sending typing status:", error)
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
            debugError("WEBSOCKET", "Error sending WebRTC signal:", error)
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
            debugError("WEBSOCKET", "Error sending media state:", error)
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
            debugLog("WEBSOCKET", "Sync request sent")
        } catch (error) {
            debugError("WEBSOCKET", "Error requesting sync:", error)
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
                debugError("WEBSOCKET", "Error parsing code change message:", error)
            }
        })
        this.subscriptions["code"] = subscription
        debugLog("WEBSOCKET", "Subscribed to code changes")
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
                debugError("WEBSOCKET", "Error parsing cursor update message:", error)
            }
        })
        this.subscriptions["cursors"] = subscription
        debugLog("WEBSOCKET", "Subscribed to cursor updates")
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
                debugError("WEBSOCKET", "Error parsing participant event message:", error)
            }
        })
        this.subscriptions["participant-events"] = subscription
        debugLog("WEBSOCKET", "Subscribed to participant events")
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
                debugError("WEBSOCKET", "Error parsing typing indicator message:", error)
            }
        })
        this.subscriptions["typing"] = subscription
        debugLog("WEBSOCKET", "Subscribed to typing indicators")
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
                debugError("WEBSOCKET", "Error parsing media state message:", error)
            }
        })
        this.subscriptions["media-state"] = subscription
        debugLog("WEBSOCKET", "Subscribed to media state changes")
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
                debugError("WEBSOCKET", "Error parsing room status message:", error)
            }
        })
        this.subscriptions["room-status"] = subscription
        debugLog("WEBSOCKET", "Subscribed to room status updates")
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
                debugError("WEBSOCKET", "Error parsing room settings message:", error)
            }
        })
        this.subscriptions["room-settings"] = subscription
        debugLog("WEBSOCKET", "Subscribed to room settings updates")
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
                debugError("WEBSOCKET", "Error parsing code submission message:", error)
            }
        })
        this.subscriptions["submission"] = subscription
        debugLog("WEBSOCKET", "Subscribed to code submissions")
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
                debugError("WEBSOCKET", "Error parsing WebRTC signal message:", error)
            }
        })
        this.subscriptions["webrtc-signal"] = subscription
        debugLog("WEBSOCKET", "Subscribed to WebRTC signals")
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
                debugError("WEBSOCKET", "Error parsing kicked notification message:", error)
            }
        })
        this.subscriptions["kicked"] = subscription
        debugLog("WEBSOCKET", "Subscribed to kick notifications")
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
                debugLog("WEBSOCKET", "Received sync response")
                callback(data)
            } catch (error) {
                debugError("WEBSOCKET", "Error parsing sync response message:", error)
            }
        })
        this.subscriptions["sync-response"] = subscription
        debugLog("WEBSOCKET", "Subscribed to sync responses")
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
                debugError("WEBSOCKET", "Error parsing error message:", error)
            }
        })
        this.subscriptions["errors"] = subscription
        debugLog("WEBSOCKET", "Subscribed to error messages")
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
        isConnecting: boolean
    } {
        return {
            connected: this.isConnected(),
            roomId: this.roomId,
            hasValidToken: !!this.token && this.validateToken(this.token),
            reconnectAttempts: this.reconnectAttempts,
            isConnecting: this.isConnecting
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