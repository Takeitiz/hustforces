"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Settings, Users, Code, Video, LogOut, Loader2, AlertCircle, MicOff, VideoOff } from "lucide-react" // Added MicOff, VideoOff
import { Button } from "../ui/Button"
import { CollaborativeEditor } from "./CollaborativeEditor"
import { MediaPanel } from "./MediaPanel"
import { ParticipantsSidebar } from "./ParticipantsSidebar"
import { RoomSettingsModal } from "./RoomSettingsModal"
import useCodeRoomStore from "../../contexts/CodeRoomContext"
import { useCodeRoom } from "../../hooks/useCodeRoom"
import { useWebRTCIntegration } from "../../hooks/useWebRTCIntegration"
import codeRoomWebSocketService from "../../service/codeRoomWebSocketService"
import { toast } from "react-toastify"

export function CodeRoomInterface() {
    const { roomCode } = useParams<{ roomCode: string }>()
    const navigate = useNavigate()
    const initializationRef = useRef(false) // To prevent double execution in StrictMode

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
    const [webRTCError, setWebRTCError] = useState<string | null>(null) // State to hold WebRTC error messages

    // Join room on mount
    useEffect(() => {
        if (initializationRef.current) {
            console.log("[CodeRoom Interface] Initialization attempt skipped (already run or in progress).")
            return
        }

        if (!roomCode) {
            console.error("[CodeRoom Interface] No room code provided, navigating away.")
            navigate("/code-rooms")
            return
        }

        initializationRef.current = true
        console.log("[CodeRoom Interface] Starting room initialization for:", roomCode)

        const initRoom = async () => {
            try {
                const roomDetails = await joinRoom(roomCode)
                console.log("[CodeRoom Interface] Successfully joined room via hook:", roomDetails.room.name)

                if (roomDetails.room.allowVoiceChat || roomDetails.room.allowVideoChat || roomDetails.room.allowScreenShare) {
                    console.log("[CodeRoom Interface] Media features allowed, attempting WebRTC initialization.")
                    try {
                        await initializeWebRTC(roomDetails.room.id)
                        setIsWebRTCReady(true)
                        setWebRTCError(null) // Clear previous errors
                        console.log("[CodeRoom Interface] WebRTC initialized successfully.")
                    } catch (error: any) {
                        console.error("[CodeRoom Interface] WebRTC initialization failed:", error.name, error.message)
                        let userFriendlyMessage = "Voice/Video features unavailable."
                        if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                            userFriendlyMessage = "No camera/microphone found, or permission denied. Voice/Video disabled."
                        } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                            userFriendlyMessage = "Permission to access camera/microphone denied. Voice/Video disabled."
                        } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
                            userFriendlyMessage = "Camera/microphone does not meet requirements. Voice/Video disabled."
                        }
                        toast.warning(userFriendlyMessage, { autoClose: 7000 })
                        setWebRTCError(userFriendlyMessage) // Store for display
                    }
                } else {
                    console.log("[CodeRoom Interface] Media features not allowed for this room.")
                    setIsWebRTCReady(false) // Ensure WebRTC is not considered ready
                }
                console.log("[CodeRoom Interface] Room initialization process completed.")
            } catch (error) {
                console.error("[CodeRoom Interface] Critical error joining room:", error)
                // initializationRef.current = false; // Allow retry if navigation happens and user comes back? Or rely on full unmount/mount.
                // This error is critical, joinRoom hook already shows a toast.
                // Navigate away if joinRoom itself fails catastrophically.
                if (!room) {
                    // If room details were never set
                    navigate("/code-rooms")
                }
            }
        }

        initRoom()

        return () => {
            console.log("[CodeRoom Interface] Unmounting. Cleaning up WebRTC and WebSocket.")
            const cleanup = async () => {
                try {
                    await codeRoomWebSocketService.disconnect() // Ensure WebSocket is disconnected
                    cleanupWebRTC() // Clean up WebRTC resources
                    reset() // Reset Zustand store
                } catch (error) {
                    console.error("[CodeRoom Interface] Error during cleanup:", error)
                }
            }
            cleanup()
            initializationRef.current = false // Reset for potential re-mounts
        }
        // Reduced dependencies: joinRoom, initializeWebRTC, cleanupWebRTC, reset, navigate should be stable.
        // roomCode is the primary trigger.
    }, [roomCode, joinRoom, initializeWebRTC, cleanupWebRTC, reset, navigate, room?.id])

    // Handle WebRTC connections for existing participants
    useEffect(() => {
        if (!isWebRTCReady || !currentUser || !room || participants.size === 0) {
            return
        }
        console.log("[CodeRoom Interface] WebRTC is ready. Checking for existing participants to connect to.")

        const connectToExistingParticipants = async () => {
            // Small delay to ensure all systems are go
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const participantsArray = Array.from(participants.values())
            console.log(`[CodeRoom Interface] Attempting to connect to ${participantsArray.length} existing participants.`)

            for (const participant of participantsArray) {
                if (participant.userId !== currentUser.userId && participant.status === "ACTIVE") {
                    console.log(`[CodeRoom Interface] Initiating WebRTC connection to: ${participant.username}`)
                    try {
                        await connectToUser(participant.userId)
                        await new Promise((resolve) => setTimeout(resolve, 200)) // Stagger connections
                    } catch (error) {
                        console.error(`[CodeRoom Interface] Failed to connect WebRTC to ${participant.username}:`, error)
                    }
                }
            }
        }

        connectToExistingParticipants()
    }, [isWebRTCReady, currentUser?.userId, room?.id, participants, connectToUser, currentUser]) // participants map itself as dep

    // Handle new participants joining (WebSocket driven)
    useEffect(() => {
        if (!isWebRTCReady || !currentUser) {
            return
        }
        console.log("[CodeRoom Interface] WebRTC ready. Setting up listener for new participant WebRTC connections.")

        const setupNewParticipantListener = async () => {
            try {
                // This listener is now primarily handled within useCodeRoom's setupWebSocketListeners
                // This effect could be simplified or removed if useCodeRoom handles all participant events
                // For now, let's assume it's for WebRTC specific logic on new joiners
                await codeRoomWebSocketService.onParticipantEvents({
                    onJoined: async (event) => {
                        if (event.participant.userId !== currentUser.userId) {
                            console.log(
                                `[CodeRoom Interface] New participant ${event.participant.username} joined. Attempting WebRTC connection.`,
                            )
                            await new Promise((resolve) => setTimeout(resolve, 1500)) // Give new user time to init their WebRTC
                            try {
                                await connectToUser(event.participant.userId)
                            } catch (error) {
                                console.error(
                                    `[CodeRoom Interface] Failed to connect WebRTC to new participant ${event.participant.username}:`,
                                    error,
                                )
                            }
                        }
                    },
                })
            } catch (error) {
                console.error("[CodeRoom Interface] Error setting up onParticipantEvents for WebRTC:", error)
            }
        }

        setupNewParticipantListener()
    }, [isWebRTCReady, currentUser?.userId, connectToUser])

    const handleLeaveRoom = async () => {
        if (confirm("Are you sure you want to leave this room?")) {
            await leaveRoom()
            // navigate("/code-rooms"); // leaveRoom hook handles navigation
        }
    }

    const handleSubmitCode = async () => {
        try {
            await submitCode()
        } catch (error) {
            // Error handled in useCodeRoom hook
        }
    }

    if (isInitializing || isJoiningRoom) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Joining Room...</h2>
                    <p className="text-gray-600 dark:text-gray-400">Setting up your collaborative environment</p>
                </div>
            </div>
        )
    }

    if (connectionError && !room) {
        // Show critical error if room connection failed and no room details
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

    if (!room || !currentUser) {
        // If room details are still not available after loading states
        console.log("[CodeRoom Interface] No room or current user details available. Rendering null or redirecting.")
        // Potentially redirect or show a more specific error if this state is reached unexpectedly
        // For now, returning null to avoid rendering a broken UI
        return null
    }

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
                            <span className="text-sm text-gray-600 dark:text-gray-400">Problem: {room.problemTitle}</span>
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
                            {(room.allowVideoChat || room.allowVoiceChat) && ( // Only show video/split if allowed
                                <>
                                    <button
                                        onClick={() => setActiveView("video")}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            activeView === "video"
                                                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                        disabled={!isWebRTCReady && (room.allowVideoChat || room.allowVoiceChat)} // Disable if WebRTC failed but features are allowed
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
                            {" "}
                            <Settings size={18} />{" "}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleLeaveRoom} disabled={isLeavingRoom}>
                            <LogOut size={18} className="mr-1" /> Leave
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {activeView === "code" || (!isWebRTCReady && (activeView === "video" || activeView === "split")) ? ( // Default to code view if WebRTC fails for video/split
                    <div className="flex-1 flex">
                        <div className="flex-1">
                            {" "}
                            <CollaborativeEditor onSubmit={handleSubmitCode} />{" "}
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div>
                ) : activeView === "video" ? (
                    <div className="flex-1 flex">
                        <div className="flex-1">
                            {" "}
                            <MediaPanel />{" "}
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div> // Split view
                ) : (
                    <div className="flex-1 flex">
                        <div className="flex-1 flex">
                            <div className="flex-1 lg:w-3/5">
                                {" "}
                                <CollaborativeEditor onSubmit={handleSubmitCode} />{" "}
                            </div>
                            <div className="hidden lg:block lg:w-2/5 border-l border-gray-200 dark:border-gray-700">
                                {" "}
                                <MediaPanel />{" "}
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
