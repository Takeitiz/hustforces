"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Settings, Users, Code, Video, LogOut, Loader2, AlertCircle, MicOff, VideoOff, Maximize2, Minimize2, GripVertical } from "lucide-react"
import { CollaborativeEditor } from "./CollaborativeEditor.tsx"
import { MediaPanel } from "./MediaPanel.tsx"
import { ParticipantsSidebar } from "./ParticipantsSidebar.tsx"
import { RoomSettingsModal } from "./RoomSettingsModal.tsx"
import { toast } from "react-toastify"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"
import useCodeRoomStore from "../../../contexts/CodeRoomContext.tsx";
import {useCodeRoom} from "../../../hooks/useCodeRoom.ts";
import {useWebRTCIntegration} from "../../../hooks/useWebRTCIntegration.ts";
import {debugError, debugLog } from "../../../utils/debug.ts"
import { performanceMonitor } from "../../../utils/performance.ts"
import codeRoomWebSocketService from "../../../service/codeRoomWebSocketService.ts";
import {Button} from "../../ui/Button.tsx";

export function CodeRoomInterface() {
    const { roomCode } = useParams<{ roomCode: string }>()
    const navigate = useNavigate()

    // Single flag to track if we've initialized
    const hasInitialized = useRef(false)

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

    const { joinRoom, leaveRoom, isJoiningRoom, isLeavingRoom, isInitializing } = useCodeRoom()
    const { initializeWebRTC, connectToUser, cleanup: cleanupWebRTC } = useWebRTCIntegration()

    const [isWebRTCReady, setIsWebRTCReady] = useState(false)
    const [webRTCError, setWebRTCError] = useState<string | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Main initialization effect - simplified
    useEffect(() => {
        if (!roomCode || hasInitialized.current) {
            return
        }

        hasInitialized.current = true
        performanceMonitor.startTimer("room_initialization")
        debugLog("CODE_ROOM", "Starting room initialization for:", roomCode)

        const initRoom = async () => {
            try {
                // Join room
                const roomDetails = await joinRoom(roomCode)

                if (!roomDetails) {
                    throw new Error("Failed to join room")
                }

                // Initialize WebRTC if media features are allowed
                if (roomDetails.room.allowVoiceChat ||
                    roomDetails.room.allowVideoChat ||
                    roomDetails.room.allowScreenShare) {

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
                        }

                        toast.warning(userFriendlyMessage, { autoClose: 7000 })
                        setWebRTCError(userFriendlyMessage)
                    }
                }

                performanceMonitor.endTimer("room_initialization", { status: "success" })
                debugLog("CODE_ROOM", "Room initialization completed successfully")

            } catch (error) {
                performanceMonitor.endTimer("room_initialization", { status: "error" })
                debugError("CODE_ROOM", "Room initialization failed:", error)

                toast.error("Failed to join room. Redirecting...")
                setTimeout(() => {
                    navigate("/code-rooms")
                }, 2000)
            }
        }

        initRoom()

        // Cleanup on unmount
        return () => {
            if (!hasInitialized.current) return;

            debugLog("CODE_ROOM", "Component unmounting, starting cleanup...")

            // Clean up everything when component unmounts
            const cleanup = async () => {
                try {
                    // Disconnect WebSocket
                    if (codeRoomWebSocketService.isConnected()) {
                        await codeRoomWebSocketService.disconnect()
                    }

                    // Clean up WebRTC
                    cleanupWebRTC()

                    // Reset store state
                    reset()
                } catch (error) {
                    debugError("CODE_ROOM", "Error during cleanup:", error)
                }
            }

            cleanup()

            // Reset initialization flag
            hasInitialized.current = false
        }
    }, [roomCode, navigate]) // Minimal dependencies

    // Handle WebRTC connections for participants
    useEffect(() => {
        if (!isWebRTCReady || !currentUser || !room || participants.size === 0) {
            return
        }

        debugLog("CODE_ROOM", "Setting up WebRTC connections for participants")

        const connectToParticipants = async () => {
            // Wait a bit for systems to be ready
            await new Promise((resolve) => setTimeout(resolve, 1000))

            for (const [userId, participant] of participants) {
                if (userId !== currentUser.userId && participant.status === "ACTIVE") {
                    debugLog("CODE_ROOM", `Connecting to participant: ${participant.username}`)
                    try {
                        await connectToUser(userId)
                        // Small delay between connections
                        await new Promise((resolve) => setTimeout(resolve, 200))
                    } catch (error) {
                        debugError("CODE_ROOM", `Failed to connect to ${participant.username}:`, error)
                    }
                }
            }
        }

        connectToParticipants()
    }, [isWebRTCReady, currentUser?.userId, room?.id, participants.size, connectToUser])

    // Handle leave room
    const handleLeaveRoom = async () => {
        if (confirm("Are you sure you want to leave this room?")) {
            await leaveRoom()
        }
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Loading state
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
        return null
    }

    // Main interface
    return (
        <div className={`h-screen flex flex-col bg-gray-100 dark:bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold">{room.name}</h1>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-mono">
                            #{room.roomCode}
                        </span>
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
                                        disabled={!isWebRTCReady}
                                    >
                                        <Video size={16} className="inline mr-1" /> Media
                                    </button>
                                    <button
                                        onClick={() => setActiveView("split")}
                                        className={`px-3 py-1 rounded text-sm transition-colors ${
                                            activeView === "split"
                                                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                        }`}
                                        disabled={!isWebRTCReady}
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
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
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
                    <PanelGroup direction="horizontal" className="h-full">
                        <Panel defaultSize={showParticipants ? 75 : 100} minSize={50}>
                            <CollaborativeEditor />
                        </Panel>
                        {showParticipants && (
                            <>
                                <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors flex items-center justify-center">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                </PanelResizeHandle>
                                <Panel defaultSize={25} minSize={15} maxSize={40}>
                                    <ParticipantsSidebar />
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                ) : activeView === "video" ? (
                    <PanelGroup direction="horizontal" className="h-full">
                        <Panel defaultSize={showParticipants ? 75 : 100} minSize={50}>
                            <MediaPanel />
                        </Panel>
                        {showParticipants && (
                            <>
                                <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors flex items-center justify-center">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                </PanelResizeHandle>
                                <Panel defaultSize={25} minSize={15} maxSize={40}>
                                    <ParticipantsSidebar />
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
                ) : (
                    // Split view
                    <PanelGroup direction="horizontal" className="h-full">
                        <Panel defaultSize={showParticipants ? 75 : 100} minSize={50}>
                            <PanelGroup direction="horizontal">
                                <Panel defaultSize={60} minSize={30}>
                                    <CollaborativeEditor />
                                </Panel>
                                <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors flex items-center justify-center">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                </PanelResizeHandle>
                                <Panel defaultSize={40} minSize={20}>
                                    <MediaPanel />
                                </Panel>
                            </PanelGroup>
                        </Panel>
                        {showParticipants && (
                            <>
                                <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 transition-colors flex items-center justify-center">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                </PanelResizeHandle>
                                <Panel defaultSize={25} minSize={15} maxSize={40}>
                                    <ParticipantsSidebar />
                                </Panel>
                            </>
                        )}
                    </PanelGroup>
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