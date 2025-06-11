import { useEffect, useRef, useState } from 'react';
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
    PhoneOff, Maximize2, Minimize2,
    Settings, Users
} from 'lucide-react';
import { toast } from 'react-toastify';
import useCodeRoomStore from "../../../contexts/CodeRoomContext.tsx";
import { useMediaDevices } from '../../../hooks/useMediaDevices.ts';
import {useWebRTCIntegration} from "../../../hooks/useWebRTCIntegration.ts";
import { Button } from '../../ui/Button.tsx';

interface MediaPanelProps {
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export function MediaPanel({ isFullscreen = false, onToggleFullscreen }: MediaPanelProps) {
    const {
        room,
        participants,
        currentUser,
        localMediaState,
        setLocalMediaState,
        localStream,
        remoteStreams,
        setLocalStream,
    } = useCodeRoomStore();

    const {
        audioDevices,
        videoDevices,
        selectedAudioDevice,
        selectedVideoDevice,
        audioLevel,
        toggleAudio: toggleDeviceAudio,
        toggleVideo: toggleDeviceVideo,
        switchAudioDevice,
        switchVideoDevice,
        getMediaStream,
        stopAllMedia
    } = useMediaDevices();

    const {
        toggleAudio: toggleWebRTCAudio,
        toggleVideo: toggleWebRTCVideo,
        startScreenShare,
        stopScreenShare
    } = useWebRTCIntegration();

    const [showDeviceSettings, setShowDeviceSettings] = useState(false);
    const [isConnecting, setIsConnecting] = useState(true);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize media on mount - UPDATED WITH PROPER CLEANUP
    useEffect(() => {
        let isMounted = true;
        let mediaCleanupInProgress = false;

        const initMedia = async () => {
            if (!room || mediaCleanupInProgress) return;

            try {
                setIsConnecting(true);

                // Get media stream if voice/video is allowed
                if (room.allowVoiceChat || room.allowVideoChat) {
                    const stream = await getMediaStream(
                        room.allowVoiceChat,
                        room.allowVideoChat && localMediaState.isVideoOn
                    );

                    if (stream && isMounted && !mediaCleanupInProgress) {
                        setLocalStream(stream);

                        // Set initial media state
                        setLocalMediaState({
                            isMuted: !room.allowVoiceChat,
                            isVideoOn: room.allowVideoChat && localMediaState.isVideoOn,
                            isScreenSharing: false
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to initialize media:', error);
                if (isMounted) {
                    toast.error('Failed to access camera/microphone');
                }
            } finally {
                if (isMounted) {
                    setIsConnecting(false);
                }
            }
        };

        initMedia();

        // Cleanup function
        return () => {
            isMounted = false;
            mediaCleanupInProgress = true;

            // Stop all tracks immediately
            if (localStream) {
                localStream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            }

            // Clean up audio context
            if (audioContextRef.current?.state !== 'closed') {
                audioContextRef.current?.close();
            }

            // Clear intervals
            if (audioLevelIntervalRef.current) {
                clearInterval(audioLevelIntervalRef.current);
            }

            // Schedule async cleanup
            Promise.resolve().then(() => {
                stopAllMedia();
            });
        };
    }, [room?.id]); // Only depend on room.id to avoid re-runs

    // Update local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Update remote video streams
    useEffect(() => {
        remoteStreams.forEach((stream, userId) => {
            const videoElement = remoteVideoRefs.current.get(userId);
            if (videoElement) {
                videoElement.srcObject = stream;
            }
        });
    }, [remoteStreams]);

    // Toggle microphone
    const handleToggleMic = async () => {
        const newState = !localMediaState.isMuted;

        // Update device
        toggleDeviceAudio(!newState);

        // Update WebRTC
        toggleWebRTCAudio(!newState);

        // Update state
        setLocalMediaState({ isMuted: newState });
    };

    // Toggle camera
    const handleToggleCamera = async () => {
        const newState = !localMediaState.isVideoOn;

        // Update device
        toggleDeviceVideo(newState);

        // Update WebRTC
        toggleWebRTCVideo(newState);

        // Update state
        setLocalMediaState({ isVideoOn: newState });
    };

    // Toggle screen share
    const handleToggleScreenShare = async () => {
        try {
            if (localMediaState.isScreenSharing) {
                await stopScreenShare();
                setLocalMediaState({ isScreenSharing: false });
            } else {
                await startScreenShare();
                setLocalMediaState({ isScreenSharing: true });
            }
        } catch (error) {
            console.error('Failed to toggle screen share:', error);
            toast.error('Failed to share screen');
        }
    };

    // Get video participants
    const getVideoParticipants = () => {
        const videoParticipants = [];

        // Add local user if video is on
        if (currentUser && localMediaState.isVideoOn) {
            videoParticipants.push({
                userId: currentUser.userId,
                username: currentUser.username,
                isLocal: true,
                stream: localStream
            });
        }

        // Add remote participants with video
        participants.forEach((participant) => {
            if (participant.isVideoOn && participant.userId !== currentUser?.userId) {
                videoParticipants.push({
                    userId: participant.userId,
                    username: participant.username,
                    isLocal: false,
                    stream: remoteStreams.get(participant.userId)
                });
            }
        });

        return videoParticipants;
    };

    const videoParticipants = getVideoParticipants();
    const gridCols = videoParticipants.length <= 1 ? 1 :
        videoParticipants.length <= 4 ? 2 :
            videoParticipants.length <= 9 ? 3 : 4;

    if (!room) return null;

    return (
        <div className={`bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-400" />
                    <span className="text-white font-medium">
                        {videoParticipants.length} participant{videoParticipants.length !== 1 ? 's' : ''} with video
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                        className="text-gray-400 hover:text-white"
                    >
                        <Settings size={18} />
                    </Button>

                    {onToggleFullscreen && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onToggleFullscreen}
                            className="text-gray-400 hover:text-white"
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </Button>
                    )}
                </div>
            </div>

            {/* Device Settings */}
            {showDeviceSettings && (
                <div className="p-4 bg-gray-800 border-b border-gray-700 space-y-3">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Microphone</label>
                        <select
                            value={selectedAudioDevice || ''}
                            onChange={(e) => switchAudioDevice(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
                            disabled={!room.allowVoiceChat}
                        >
                            {audioDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 block mb-1">Camera</label>
                        <select
                            value={selectedVideoDevice || ''}
                            onChange={(e) => switchVideoDevice(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded px-3 py-1 text-sm"
                            disabled={!room.allowVideoChat}
                        >
                            {videoDevices.map(device => (
                                <option key={device.deviceId} value={device.deviceId}>
                                    {device.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Audio Level Indicator */}
                    {room.allowVoiceChat && !localMediaState.isMuted && (
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Audio Level</label>
                            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-green-500 h-full transition-all duration-100"
                                    style={{ width: `${audioLevel}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Video Grid */}
            <div className="flex-1 p-4 overflow-auto">
                {isConnecting ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-400">Connecting to media...</p>
                        </div>
                    </div>
                ) : videoParticipants.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <VideoOff size={48} className="text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No active video streams</p>
                            {room.allowVideoChat && !localMediaState.isVideoOn && (
                                <Button
                                    size="sm"
                                    onClick={handleToggleCamera}
                                    className="mt-4"
                                >
                                    Start Video
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`grid grid-cols-${gridCols} gap-4 h-full`}>
                        {videoParticipants.map(({ userId, username, isLocal, stream }) => (
                            <div
                                key={userId}
                                className="relative bg-gray-800 rounded-lg overflow-hidden"
                            >
                                <video
                                    ref={(el) => {
                                        if (el) {
                                            if (isLocal) {
                                                localVideoRef.current = el;
                                            } else {
                                                remoteVideoRefs.current.set(userId, el);
                                            }
                                            if (stream) {
                                                el.srcObject = stream;
                                            }
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    muted={isLocal}
                                    className="w-full h-full object-cover"
                                />

                                {/* Participant Info */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <p className="text-white text-sm font-medium">
                                        {username} {isLocal && '(You)'}
                                    </p>
                                </div>

                                {/* Muted Indicator */}
                                {isLocal && localMediaState.isMuted && (
                                    <div className="absolute top-3 right-3 bg-red-500 rounded-full p-1">
                                        <MicOff size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center justify-center gap-4">
                    {/* Mic Toggle */}
                    {room.allowVoiceChat && (
                        <Button
                            size="sm"
                            variant={localMediaState.isMuted ? 'destructive' : 'default'}
                            onClick={handleToggleMic}
                            className="flex items-center gap-2"
                        >
                            {localMediaState.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            {localMediaState.isMuted ? 'Unmute' : 'Mute'}
                        </Button>
                    )}

                    {/* Camera Toggle */}
                    {room.allowVideoChat && (
                        <Button
                            size="sm"
                            variant={localMediaState.isVideoOn ? 'default' : 'outline'}
                            onClick={handleToggleCamera}
                            className="flex items-center gap-2"
                        >
                            {localMediaState.isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
                            {localMediaState.isVideoOn ? 'Stop Video' : 'Start Video'}
                        </Button>
                    )}

                    {/* Screen Share Toggle */}
                    {room.allowScreenShare && (
                        <Button
                            size="sm"
                            variant={localMediaState.isScreenSharing ? 'default' : 'outline'}
                            onClick={handleToggleScreenShare}
                            className="flex items-center gap-2"
                        >
                            {localMediaState.isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                            {localMediaState.isScreenSharing ? 'Stop Share' : 'Share Screen'}
                        </Button>
                    )}

                    {/* Leave Call */}
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopAllMedia}
                        className="flex items-center gap-2"
                    >
                        <PhoneOff size={18} />
                        Leave
                    </Button>
                </div>
            </div>
        </div>
    );
}