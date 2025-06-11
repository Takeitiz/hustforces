"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Settings, Users, Code, Video, LogOut, Loader2, AlertCircle, MicOff, VideoOff } from "lucide-react"
import { Button } from "../ui/Button"
import { CollaborativeEditor } from "./CollaborativeEditor"
import { MediaPanel } from "./MediaPanel"
import { ParticipantsSidebar } from "./ParticipantsSidebar"
import { RoomSettingsModal } from "./RoomSettingsModal"
import useCodeRoomStore from "../../contexts/CodeRoomContext"
import { useCodeRoom } from "../../hooks/useCodeRoom"
import { useWebRTCIntegration } from "../../hooks/useWebRTCIntegration"
import codeRoomWebSocketService from "../../service/codeRoomWebSocketService"
import codeRoomService from "../../service/codeRoomService"
import { toast } from "react-toastify"
import { debugLog, debugError } from "../../utils/debug"
import { performanceMonitor } from "../../utils/performance"

export function CodeRoomInterface() {
    const { roomCode } = useParams<{ roomCode: string }>()
    const navigate = useNavigate()

    // Use refs to track initialization state
    const initializationRef = useRef(false)
    const mountedRef = useRef(true)
    const retryCountRef = useRef(0)

    const {
        room,
        currentUser,
        participants,
        isConnected,
        connectionError,
        activeView,
        showSettings,
        showParticipants,
        setActiveView,
        setShowSettings,
        setShowParticipants,
        reset,
    } = useCodeRoomStore()

    const { joinRoom, leaveRoom, submitCode, isJoiningRoom, isLeavingRoom, isInitializing } = useCodeRoom()
    const { initializeWebRTC, connectToUser, cleanup: cleanupWebRTC } = useWebRTCIntegration()

    const [isWebRTCReady, setIsWebRTCReady] = useState(false)
    const [webRTCError, setWebRTCError] = useState<string | null>(null)

    // Track mounted state
    useEffect(() => {
        mountedRef.current = true
        debugLog("CODE_ROOM", "CodeRoomInterface mounted")

        return () => {
            mountedRef.current = false
            debugLog("CODE_ROOM", "CodeRoomInterface unmounting")
        }
    }, [])

    // Main initialization effect
    useEffect(() => {
        // Skip if already initializing or component unmounted
        if (initializationRef.current || !mountedRef.current) {
            debugLog("CODE_ROOM", "Skipping initialization (already running or unmounted)")
            return
        }

        if (!roomCode) {
            debugError("CODE_ROOM", "No room code provided")
            navigate("/code-rooms")
            return
        }

        const initRoom = async () => {
            initializationRef.current = true
            performanceMonitor.startTimer("room_initialization")
            debugLog("CODE_ROOM", "Starting room initialization for:", roomCode)

            try {
                // Step 1: Check backend health
                debugLog("CODE_ROOM", "Checking backend health...")
                const isHealthy = await codeRoomService.checkBackendHealth()
                if (!isHealthy) {
                    throw new Error("Backend is not available")
                }

                // Step 2: Join room with retry logic
                let roomDetails = null
                const maxRetries = 3

                for (let i = 0; i < maxRetries; i++) {
                    try {
                        debugLog("CODE_ROOM", `Join attempt ${i + 1}/${maxRetries}`)
                        roomDetails = await joinRoom(roomCode)
                        debugLog("CODE_ROOM", "Successfully joined room")
                        break
                    } catch (error) {
                        retryCountRef.current = i + 1
                        debugError("CODE_ROOM", `Join attempt ${i + 1} failed:`, error)

                        if (i < maxRetries - 1 && mountedRef.current) {
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        } else {
                            throw error
                        }
                    }
                }

                if (!roomDetails || !mountedRef.current) {
                    throw new Error("Failed to join room after retries")
                }

                // Step 3: Initialize WebRTC if needed
                if (roomDetails.room.allowVoiceChat ||
                    roomDetails.room.allowVideoChat ||
                    roomDetails.room.allowScreenShare) {

                    if (mountedRef.current) {
                        try {
                            debugLog("CODE_ROOM", "Initializing WebRTC...")
                            await initializeWebRTC(roomDetails.room.id)
                            setIsWebRTCReady(true)
                            setWebRTCError(null)
                            debugLog("CODE_ROOM", "WebRTC initialized successfully")
                        } catch (error: any) {
                            debugError("CODE_ROOM", "WebRTC initialization failed:", error)

                            let userFriendlyMessage = "Voice/Video features unavailable."
                            if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                                userFriendlyMessage = "No camera/microphone found. Voice/Video disabled."
                            } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                                userFriendlyMessage = "Permission to access camera/microphone denied. Voice/Video disabled."
                            } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
                                userFriendlyMessage = "Camera/microphone does not meet requirements. Voice/Video disabled."
                            }

                            toast.warning(userFriendlyMessage, { autoClose: 7000 })
                            setWebRTCError(userFriendlyMessage)
                        }
                    }
                } else {
                    debugLog("CODE_ROOM", "Media features not allowed for this room")
                    setIsWebRTCReady(false)
                }

                performanceMonitor.endTimer("room_initialization", { status: "success" })
                debugLog("CODE_ROOM", "Room initialization completed successfully")

            } catch (error) {
                performanceMonitor.endTimer("room_initialization", { status: "error" })
                debugError("CODE_ROOM", "Room initialization failed:", error)

                if (mountedRef.current) {
                    toast.error("Failed to join room. Redirecting...")
                    setTimeout(() => {
                        if (mountedRef.current) {
                            navigate("/code-rooms")
                        }
                    }, 2000)
                }
            } finally {
                if (mountedRef.current) {
                    initializationRef.current = false
                }
            }
        }

        // Start initialization
        initRoom()

        // Cleanup function
        return () => {
            debugLog("CODE_ROOM", "Component unmounting, starting cleanup")

            const cleanup = async () => {
                try {
                    // Cancel any pending operations
                    initializationRef.current = false

                    // Disconnect WebSocket
                    if (codeRoomWebSocketService.isConnected()) {
                        await codeRoomWebSocketService.disconnect()
                    }

                    // Clean up WebRTC
                    cleanupWebRTC()

                    // Reset store state
                    reset()
                } catch (error) {
                    debugError("CODE_ROOM", "Cleanup error:", error)
                }
            }

            cleanup()
        }
    }, [roomCode]) // Only depend on roomCode

    // Handle WebRTC connections for existing participants
    useEffect(() => {
        if (!isWebRTCReady || !currentUser || !room || participants.size === 0) {
            return
        }

        debugLog("CODE_ROOM", "WebRTC is ready. Checking for existing participants to connect to.")

        const connectToExistingParticipants = async () => {
            // Small delay to ensure all systems are ready
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const participantsArray = Array.from(participants.values())
            debugLog("CODE_ROOM", `Attempting to connect to ${participantsArray.length} existing participants.`)

            for (const participant of participantsArray) {
                if (participant.userId !== currentUser.userId && participant.status === "ACTIVE") {
                    debugLog("CODE_ROOM", `Initiating WebRTC connection to: ${participant.username}`)
                    try {
                        await connectToUser(participant.userId)
                        await new Promise((resolve) => setTimeout(resolve, 200)) // Stagger connections
                    } catch (error) {
                        debugError("CODE_ROOM", `Failed to connect WebRTC to ${participant.username}:`, error)
                    }
                }
            }
        }

        connectToExistingParticipants()
    }, [isWebRTCReady, currentUser?.userId, room?.id, participants.size])

    // Handle new participants joining (WebSocket driven)
    useEffect(() => {
        if (!isWebRTCReady || !currentUser) {
            return
        }

        debugLog("CODE_ROOM", "WebRTC ready. Setting up listener for new participant WebRTC connections.")

        const setupNewParticipantListener = async () => {
            try {
                await codeRoomWebSocketService.onParticipantEvents({
                    onJoined: async (event) => {
                        if (event.participant.userId !== currentUser.userId) {
                            debugLog("CODE_ROOM", `New participant ${event.participant.username} joined. Attempting WebRTC connection.`)
                            await new Promise((resolve) => setTimeout(resolve, 1500)) // Give new user time to init their WebRTC
                            try {
                                await connectToUser(event.participant.userId)
                            } catch (error) {
                                debugError("CODE_ROOM", `Failed to connect WebRTC to new participant ${event.participant.username}:`, error)
                            }
                        }
                    },
                })
            } catch (error) {
                debugError("CODE_ROOM", "Error setting up onParticipantEvents for WebRTC:", error)
            }
        }

        setupNewParticipantListener()
    }, [isWebRTCReady, currentUser?.userId, connectToUser])

    const handleLeaveRoom = async () => {
        if (confirm("Are you sure you want to leave this room?")) {
            await leaveRoom()
        }
    }

    const handleSubmitCode = async () => {
        try {
            await submitCode()
        } catch (error) {
            // Error handled in useCodeRoom hook
        }
    }

    // Loading state
    if (isInitializing || isJoiningRoom) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Joining Room...</h2>
                    <p className="text-gray-600 dark:text-gray-400">Setting up your collaborative environment</p>
                    {retryCountRef.current > 0 && (
                        <p className="text-sm text-gray-500 mt-2">
                            Retry attempt {retryCountRef.current}/3
                        </p>
                    )}
                </div>
            </div>
        )
    }

    // Error state
    if (connectionError && !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md p-4">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{connectionError}</p>
                    <Button onClick={() => navigate("/code-rooms")}>Back to Rooms</Button>
                </div>
            </div>
        )
    }

    // No room state
    if (!room || !currentUser) {
        debugLog("CODE_ROOM", "No room or current user details available")
        return null
    }

    // Main interface
    return (
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">{room.name}</h1>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-mono">
                            #{room.roomCode}
                        </span>
                        {room.problemTitle && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Problem: {room.problemTitle}
                            </span>
                        )}
                        {/* Display WebRTC Error if present */}
                        {webRTCError && (
                            <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                                {(webRTCError.includes("camera") || webRTCError.includes("video")) && <VideoOff size={14} />}
                                {(webRTCError.includes("microphone") || webRTCError.includes("audio")) && <MicOff size={14} />}
                                {webRTCError}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setActiveView("code")}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    activeView === "code"
                                        ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                }`}
                            >
                                <Code size={16} className="inline mr-1" /> Code
                            </button>
                            {(room.allowVideoChat || room.allowVoiceChat) && (
                                <>
                                    <button
                                        onClick={() => setActiveView("video")}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            activeView === "video"
                                                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                        disabled={!isWebRTCReady && (room.allowVideoChat || room.allowVoiceChat)}
                                    >
                                        <Video size={16} className="inline mr-1" /> Video
                                    </button>
                                    <button
                                        onClick={() => setActiveView("split")}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            activeView === "split"
                                                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                        disabled={!isWebRTCReady && (room.allowVideoChat || room.allowVoiceChat)}
                                    >
                                        Split
                                    </button>
                                </>
                            )}
                        </div>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowParticipants(!showParticipants)}
                            className="relative"
                        >
                            <Users size={18} />
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                               {participants.size}
                           </span>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)}>
                            <Settings size={18} />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleLeaveRoom} disabled={isLeavingRoom}>
                            <LogOut size={18} className="mr-1" /> Leave
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {activeView === "code" || (!isWebRTCReady && (activeView === "video" || activeView === "split")) ? (
                    <div className="flex-1 flex">
                        <div className="flex-1">
                            <CollaborativeEditor onSubmit={handleSubmitCode} />
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div>
                ) : activeView === "video" ? (
                    <div className="flex-1 flex">
                        <div className="flex-1">
                            <MediaPanel />
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div>
                ) : (
                    // Split view
                    <div className="flex-1 flex">
                        <div className="flex-1 flex">
                            <div className="flex-1 lg:w-3/5">
                                <CollaborativeEditor onSubmit={handleSubmitCode} />
                            </div>
                            <div className="hidden lg:block lg:w-2/5 border-l border-gray-200 dark:border-gray-700">
                                <MediaPanel />
                            </div>
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div>
                )}
            </div>

            {!isConnected && (
                <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" /> Reconnecting...
                </div>
            )}

            <RoomSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    )
}