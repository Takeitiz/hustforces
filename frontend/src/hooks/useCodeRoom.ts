"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import useCodeRoomStore from "../contexts/CodeRoomContext"
import codeRoomService from "../service/codeRoomService"
import codeRoomWebSocketService from "../service/codeRoomWebSocketService"
import authService from "../service/authService"
import {
    type CreateCodeRoomRequest,
    type UpdateCodeRoomRequest,
    type ParticipantRole,
    CodeRoomStatus,
} from "../types/codeRoom"

export function useCodeRoom() {
    const navigate = useNavigate()
    const [isInitializing, setIsInitializing] = useState(false)
    const participantNamesRef = useRef<Map<string, string>>(new Map())

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
        canEdit,
        setCurrentCode,
    } = useCodeRoomStore()

    useEffect(() => {
        participants.forEach((participant, userId) => {
            participantNamesRef.current.set(userId, participant.username)
        })
    }, [participants])

    // Get auth token
    const getToken = useCallback(() => {
        const token = authService.getToken()
        if (!token) {
            throw new Error("Not authenticated")
        }
        return token
    }, [])

    // Create a new code room
    const createRoom = useCallback(
        async (request: CreateCodeRoomRequest) => {
            try {
                setCreatingRoom(true)
                const newRoom = await codeRoomService.createRoom(request)
                setRoom(newRoom)
                toast.success("Room created successfully!")

                // Navigate to the room
                navigate(`/code-room/${newRoom.roomCode}`)

                return newRoom
            } catch (error: any) {
                console.error("Failed to create room:", error)
                const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to create room"
                toast.error(errorMessage)
                throw error
            } finally {
                setCreatingRoom(false)
            }
        },
        [navigate, setCreatingRoom, setRoom],
    )

    // Set up WebSocket event listeners
    const setupWebSocketListeners = useCallback(async () => {
        console.log("[CodeRoom Hook] Setting up WebSocket listeners...")

        try {
            // Handle participant events
            await codeRoomWebSocketService.onParticipantEvents({
                onJoined: (event) => {
                    console.log("[CodeRoom Hook] Participant joined:", event.participant.username)
                    // Store the name immediately
                    participantNamesRef.current.set(event.participant.userId, event.participant.username)
                    addParticipant(event.participant)
                    toast.info(`${event.participant.username} joined the room`)
                },
                onLeft: (event) => {
                    // Get the username from our ref
                    const username = participantNamesRef.current.get(event.userId)

                    if (username) {
                        console.log("[CodeRoom Hook] Participant left:", username)
                        toast.info(`${username} left the room`)
                        // Clean up the ref
                        participantNamesRef.current.delete(event.userId)
                    } else {
                        console.log("[CodeRoom Hook] Unknown participant left:", event.userId)
                        toast.info(`A participant left the room`)
                    }

                    removeParticipant(event.userId)
                },
                onStatusChange: (event) => {
                    console.log("[CodeRoom Hook] Participant status changed:", event.userId, event.newStatus)
                    updateParticipant(event.userId, { status: event.newStatus })

                    // Show disconnection notifications
                    if (event.newStatus === 'DISCONNECTED') {
                        const username = participantNamesRef.current.get(event.userId)
                        if (username) {
                            toast.warning(`${username} disconnected`)
                        }
                    }
                },
                onRoleChange: (event) => {
                    console.log("[CodeRoom Hook] Participant role changed:", event.userId, event.newRole)
                    updateParticipant(event.userId, { role: event.newRole })

                    const username = participantNamesRef.current.get(event.userId)
                    if (username) {
                        toast.info(`${username}'s role changed to ${event.newRole}`)
                    }
                },
            })

            // Handle room status updates
            await codeRoomWebSocketService.onRoomStatusUpdate((event) => {
                console.log("[CodeRoom Hook] Room status update:", event)
                if ("message" in event) {
                    // Room deleted
                    toast.error(event.message)
                    reset()
                    navigate("/code-rooms")
                } else if (room) {
                    // Room closed
                    toast.info("Room has been closed")
                    setRoom({ ...room, status: CodeRoomStatus.COMPLETED })
                }
            })

            // Handle room settings updates
            await codeRoomWebSocketService.onRoomSettingsUpdate((event) => {
                console.log("[CodeRoom Hook] Room settings updated")
                setRoom(event.room)
                toast.info("Room settings updated")
            })

            // Handle being kicked
            await codeRoomWebSocketService.onKicked((event) => {
                console.log("[CodeRoom Hook] User kicked:", event.message)
                toast.error(event.message)
                reset()
                navigate("/code-rooms")
            })

            // Handle sync response
            await codeRoomWebSocketService.onSyncResponse((response) => {
                console.log("[CodeRoom Hook] Sync response received")

                // Update current code and participants
                setCurrentCode(response.currentCode)

                // Update participant names ref from sync
                response.participants.forEach((participant) => {
                    participantNamesRef.current.set(participant.userId, participant.username)
                    addParticipant(participant)
                })

                setSyncing(false)
            })

            // Handle errors
            await codeRoomWebSocketService.onError((error) => {
                console.error("[CodeRoom Hook] WebSocket error:", error)
                toast.error(error.error)
                setConnectionError(error.error)
            })

            console.log("[CodeRoom Hook] WebSocket listeners setup complete")
        } catch (error) {
            console.error("[CodeRoom Hook] Error setting up WebSocket listeners:", error)
            throw error
        }
    }, [
        navigate,
        reset,
        setRoom,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setSyncing,
        setConnectionError,
        setCurrentCode,
        room,
    ])

    const joinRoom = useCallback(
        async (roomCode: string) => {
            console.log("[CodeRoom Hook] Starting join room process for:", roomCode)

            // Check if already joining to prevent duplicate attempts
            if (isJoiningRoom) {
                console.log("[CodeRoom Hook] Already joining room, skipping duplicate attempt")
                return
            }

            try {
                setJoiningRoom(true)
                setIsInitializing(true)
                setConnectionError(null)

                // Step 1: Join room via REST API
                console.log("[CodeRoom Hook] Joining room via API...")
                try {
                    await codeRoomService.joinRoom({ roomCode })
                    console.log("[CodeRoom Hook] Join API response received")
                } catch (error: any) {
                    // Check if the error is because user is already in the room
                    if (error.response?.status === 409 || error.response?.data?.errorMessage?.includes("already in")) {
                        console.log("[CodeRoom Hook] User already in room, continuing...")
                        // Continue with the flow as the user is already in the room
                    } else if (error.response?.data?.errorMessage?.includes("full")) {
                        // Room is actually full
                        throw new Error("Room is full")
                    } else {
                        throw error
                    }
                }

                // Step 2: Get room details with retry
                console.log("[CodeRoom Hook] Fetching room details...")
                let roomDetails = null
                let lastError = null

                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        roomDetails = await codeRoomService.getRoomByCode(roomCode)
                        console.log("[CodeRoom Hook] Room details retrieved successfully")
                        break
                    } catch (error) {
                        lastError = error
                        console.log(`[CodeRoom Hook] Attempt ${attempt} failed to get room details`)

                        if (attempt < 3) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                        }
                    }
                }

                if (!roomDetails) {
                    throw lastError || new Error("Failed to retrieve room details")
                }

                // Step 3: Set room details in store
                setRoomDetails(roomDetails)

                // Step 4: Get authentication token
                const token = getToken()
                if (!token) {
                    throw new Error("Authentication required")
                }

                // Step 5: Disconnect any existing WebSocket connection first
                if (codeRoomWebSocketService.isConnected()) {
                    console.log("[CodeRoom Hook] Disconnecting existing WebSocket connection...")
                    await codeRoomWebSocketService.disconnect()
                }

                // Step 6: Connect to WebSocket
                console.log("[CodeRoom Hook] Connecting to WebSocket...")
                await codeRoomWebSocketService.connect({
                    roomId: roomDetails.room.id,
                    token,
                    onAuthError: () => {
                        console.error("[CodeRoom Hook] WebSocket authentication failed")
                        toast.error("Authentication failed. Please log in again.")
                        navigate("/login")
                    },
                    onConnectionError: (error) => {
                        console.error("[CodeRoom Hook] WebSocket connection error:", error)
                        setConnectionError(error.message)
                        toast.error(`Connection error: ${error.message}`)
                    },
                    onReconnect: () => {
                        console.log("[CodeRoom Hook] WebSocket reconnected")
                        toast.success("Reconnected to room")
                        setConnectionError(null)
                    },
                })

                // Step 7: Wait for connection to establish
                let connectionEstablished = false
                for (let i = 0; i < 10; i++) {
                    if (codeRoomWebSocketService.isConnected()) {
                        connectionEstablished = true
                        break
                    }
                    await new Promise(resolve => setTimeout(resolve, 500))
                }

                if (!connectionEstablished) {
                    throw new Error("Failed to establish WebSocket connection")
                }

                console.log("[CodeRoom Hook] WebSocket connected successfully")

                // Step 8: Set up event listeners
                await setupWebSocketListeners()

                // Step 9: Request initial sync
                console.log("[CodeRoom Hook] Requesting initial sync...")
                await codeRoomWebSocketService.requestSync()

                // Step 10: Mark as connected
                setConnected(true)
                setConnectionError(null)

                console.log("[CodeRoom Hook] Room join completed successfully")
                toast.success("Joined room successfully!")

                return roomDetails

            } catch (error: any) {
                console.error("[CodeRoom Hook] Failed to join room:", error)

                const errorMessage =
                    error.response?.data?.errorMessage ||
                    error.message ||
                    "Failed to join room"

                setConnectionError(errorMessage)
                toast.error(errorMessage)

                // Only reset if it's a critical error
                if (!errorMessage.includes("already in")) {
                    // Cleanup on error
                    await codeRoomWebSocketService.disconnect()
                    reset()
                }

                throw error
            } finally {
                setJoiningRoom(false)
                setIsInitializing(false)
            }
        },
        [getToken, navigate, setRoomDetails, setConnected, setConnectionError, setupWebSocketListeners, reset, setJoiningRoom, setIsInitializing, isJoiningRoom]
    )

    // Leave the current room
    const leaveRoom = useCallback(async () => {
        if (!room) return

        try {
            console.log("[CodeRoom Hook] Leaving room:", room.id)
            setLeavingRoom(true)

            // Leave room via API
            await codeRoomService.leaveRoom(room.id)

            // Disconnect WebSocket
            await codeRoomWebSocketService.disconnect()

            // Reset store
            reset()

            toast.success("Left room successfully")
            navigate("/code-rooms")
        } catch (error: any) {
            console.error("[CodeRoom Hook] Failed to leave room:", error)
            const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to leave room"
            toast.error(errorMessage)
        } finally {
            setLeavingRoom(false)
        }
    }, [room, navigate, reset, setLeavingRoom])

    // Update room settings (host only)
    const updateRoomSettings = useCallback(
        async (updates: UpdateCodeRoomRequest) => {
            if (!room || !isHost()) {
                toast.error("Only the host can update room settings")
                return
            }

            try {
                const updatedRoom = await codeRoomService.updateRoom(room.id, updates)
                setRoom(updatedRoom)
                toast.success("Room settings updated")
                return updatedRoom
            } catch (error: any) {
                console.error("Failed to update room:", error)
                const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to update room settings"
                toast.error(errorMessage)
                throw error
            }
        },
        [room, isHost, setRoom],
    )

    // Delete room (host only)
    const deleteRoom = useCallback(async () => {
        if (!room || !isHost()) {
            toast.error("Only the host can delete the room")
            return
        }

        if (!confirm("Are you sure you want to delete this room? This action cannot be undone.")) {
            return
        }

        try {
            await codeRoomService.deleteRoom(room.id)
            toast.success("Room deleted successfully")
            navigate("/code-rooms")
        } catch (error: any) {
            console.error("Failed to delete room:", error)
            const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to delete room"
            toast.error(errorMessage)
        }
    }, [room, isHost, navigate])

    // End session (host only)
    const endSession = useCallback(async () => {
        if (!room || !isHost()) {
            toast.error("Only the host can end the session")
            return
        }

        try {
            await codeRoomService.endSession(room.id)
            toast.success("Session ended successfully")
            navigate("/code-rooms")
        } catch (error: any) {
            console.error("Failed to end session:", error)
            const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to end session"
            toast.error(errorMessage)
            throw error
        }
    }, [room, isHost, navigate])

    // Kick participant (host only)
    const kickParticipant = useCallback(
        async (userId: string) => {
            if (!room || !isHost()) {
                toast.error("Only the host can kick participants")
                return
            }

            try {
                await codeRoomService.kickParticipant(room.id, userId)
                removeParticipant(userId)
                toast.success("Participant kicked")
            } catch (error: any) {
                console.error("Failed to kick participant:", error)
                const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to kick participant"
                toast.error(errorMessage)
            }
        },
        [room, isHost, removeParticipant],
    )

    // Update participant role (host only)
    const updateParticipantRole = useCallback(
        async (userId: string, role: ParticipantRole) => {
            if (!room || !isHost()) {
                toast.error("Only the host can change participant roles")
                return
            }

            try {
                await codeRoomService.updateParticipantRole(room.id, userId, role)
                updateParticipant(userId, { role })
                toast.success("Role updated successfully")
            } catch (error: any) {
                console.error("Failed to update role:", error)
                const errorMessage = error.response?.data?.errorMessage || error.message || "Failed to update participant role"
                toast.error(errorMessage)
            }
        },
        [room, isHost, updateParticipant],
    )

    // Add cleanup for the ref on unmount
    useEffect(() => {
        return () => {
            participantNamesRef.current.clear()
        }
    }, [])

    // Handle connection state changes
    useEffect(() => {
        if (connectionError) {
            console.error("[CodeRoom Hook] Connection error:", connectionError)
            toast.error(`Connection error: ${connectionError}`)
        }
    }, [connectionError])

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
        endSession,

        // Utility
        isHost,
        canEdit,
        participantCount: participants.size,
        isRoomActive: room?.status === CodeRoomStatus.ACTIVE,
    }
}