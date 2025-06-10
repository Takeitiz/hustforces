import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Code, Video, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { CollaborativeEditor } from './CollaborativeEditor';
import { MediaPanel } from './MediaPanel';
import { ParticipantsSidebar } from './ParticipantsSidebar';
import { RoomSettingsModal } from './RoomSettingsModal';
import useCodeRoomStore from '../../store/useCodeRoomStore';
import { useCodeRoom } from '../../hooks/useCodeRoom';
import { useWebRTCIntegration } from '../../hooks/useWebRTCIntegration';
import codeRoomWebSocketService from '../../service/codeRoomWebSocketService';
import { toast } from 'react-toastify';

export function CodeRoomInterface() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();

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
        reset
    } = useCodeRoomStore();

    const {
        joinRoom,
        leaveRoom,
        submitCode,
        isJoiningRoom,
        isLeavingRoom,
        isInitializing
    } = useCodeRoom();

    const {
        initializeWebRTC,
        connectToUser,
        cleanup: cleanupWebRTC
    } = useWebRTCIntegration();

    const [isWebRTCReady, setIsWebRTCReady] = useState(false);

    // Join room on mount - UPDATED WITHOUT setIsInitializing
    useEffect(() => {
        if (!roomCode) {
            navigate('/code-rooms');
            return;
        }

        const initRoom = async () => {
            try {
                // Join the room (initialization is handled internally)
                const roomDetails = await joinRoom(roomCode);

                // Initialize WebRTC if media is allowed
                if (roomDetails.room.allowVoiceChat ||
                    roomDetails.room.allowVideoChat ||
                    roomDetails.room.allowScreenShare) {
                    try {
                        await initializeWebRTC(roomDetails.room.id);
                        setIsWebRTCReady(true);
                    } catch (error) {
                        console.error('WebRTC initialization failed:', error);
                        toast.warning('Voice/Video features unavailable');
                        // Continue without WebRTC
                    }
                }
            } catch (error) {
                console.error('Failed to join room:', error);
                navigate('/code-rooms');
            }
        };

        initRoom();

        // Cleanup on unmount
        return () => {
            // Use Promise to handle async cleanup
            const cleanup = async () => {
                try {
                    await codeRoomWebSocketService.disconnect();
                    cleanupWebRTC();
                    reset();
                } catch (error) {
                    console.error('Cleanup error:', error);
                }
            };

            cleanup();
        };
    }, [roomCode]);

    // Handle WebRTC connections for existing participants - UPDATED
    useEffect(() => {
        if (!isWebRTCReady || !currentUser || !room) return;

        const connectToExistingParticipants = async () => {
            // Wait a bit to ensure WebSocket is fully ready
            await new Promise(resolve => setTimeout(resolve, 500));

            // Connect to existing participants
            const participantsArray = Array.from(participants.values());

            for (const participant of participantsArray) {
                if (participant.userId !== currentUser.userId &&
                    participant.status === 'ACTIVE') {
                    try {
                        await connectToUser(participant.userId);
                        // Small delay between connections to avoid overwhelming
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error(`Failed to connect to ${participant.username}:`, error);
                    }
                }
            }
        };

        connectToExistingParticipants();
    }, [isWebRTCReady, currentUser, room?.id]); // Only depend on room.id, not participants

    // Handle new participants joining separately - UPDATED
    useEffect(() => {
        if (!isWebRTCReady || !currentUser) return;

        const handleNewParticipant = async () => {
            await codeRoomWebSocketService.onParticipantEvents({
                onJoined: async (event) => {
                    if (event.participant.userId !== currentUser.userId) {
                        // Wait a bit for the new user to set up their WebRTC
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        try {
                            await connectToUser(event.participant.userId);
                        } catch (error) {
                            console.error(`Failed to connect to new participant:`, error);
                        }
                    }
                }
            });
        };

        handleNewParticipant();
    }, [isWebRTCReady, currentUser, connectToUser]);

    // Handle leave room
    const handleLeaveRoom = async () => {
        if (confirm('Are you sure you want to leave this room?')) {
            await leaveRoom();
            navigate('/code-rooms');
        }
    };

    // Handle submit code
    const handleSubmitCode = async () => {
        try {
            await submitCode();
        } catch (error) {
            // Error handled in hook
        }
    };

    // Loading state
    if (isInitializing || isJoiningRoom) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Joining Room...</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Setting up your collaborative environment
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (connectionError && !room) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {connectionError}
                    </p>
                    <Button onClick={() => navigate('/code-rooms')}>
                        Back to Rooms
                    </Button>
                </div>
            </div>
        );
    }

    if (!room || !currentUser) {
        return null;
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
            {/* Header */}
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
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setActiveView('code')}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    activeView === 'code'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <Code size={16} className="inline mr-1" />
                                Code
                            </button>
                            <button
                                onClick={() => setActiveView('video')}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    activeView === 'video'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <Video size={16} className="inline mr-1" />
                                Video
                            </button>
                            <button
                                onClick={() => setActiveView('split')}
                                className={`px-3 py-1 rounded text-sm transition-colors ${
                                    activeView === 'split'
                                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Split
                            </button>
                        </div>

                        {/* Action Buttons */}
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
                            onClick={() => setShowSettings(true)}
                        >
                            <Settings size={18} />
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleLeaveRoom}
                            disabled={isLeavingRoom}
                        >
                            <LogOut size={18} className="mr-1" />
                            Leave
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {activeView === 'code' ? (
                    <div className="flex-1 flex">
                        <div className="flex-1">
                            <CollaborativeEditor onSubmit={handleSubmitCode} />
                        </div>
                        {showParticipants && <ParticipantsSidebar />}
                    </div>
                ) : activeView === 'video' ? (
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

            {/* Connection Status */}
            {!isConnected && (
                <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Reconnecting...
                </div>
            )}

            {/* Modals */}
            <RoomSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
}