import { useEffect, useCallback } from 'react';
import webRTCService from '../service/webRTCService';
import codeRoomWebSocketService from '../service/codeRoomWebSocketService';
import codeRoomService from '../service/codeRoomService';
import { WebRTCSignalDto } from '../types/codeRoom';

/**
 * Hook to integrate WebRTC with WebSocket for code room video/audio
 */
export function useWebRTCIntegration() {
    // Set up the signal sender to use WebSocket
    useEffect(() => {
        // Configure WebRTC to send signals through WebSocket
        webRTCService.setSignalSender((signal: WebRTCSignalDto) => {
            codeRoomWebSocketService.sendWebRTCSignal(signal);
        });

        // Clean up on unmount
        return () => {
            webRTCService.setSignalSender(() => {
                console.warn('WebRTC signal sender cleared');
            });
        };
    }, []);

    // Handle incoming WebRTC signals
    const setupWebRTCListeners = useCallback(async () => {
        // Listen for WebRTC signals from other users
        await codeRoomWebSocketService.onWebRTCSignal(async (signal) => {
            try {
                await webRTCService.handleSignal(signal);
            } catch (error) {
                console.error('Error handling WebRTC signal:', error);
            }
        });
    }, []);

    // Initialize WebRTC with server config
    // @ts-ignore
    const initializeWebRTC = useCallback(async (roomId: string) => {
        try {
            // Get WebRTC configuration from server
            const webrtcConfig = await codeRoomService.getWebRTCConfig();

            // Initialize WebRTC with the config
            webRTCService.initialize(webrtcConfig);

            // Set up listeners for incoming signals
            await setupWebRTCListeners();

            // Get user media (camera/mic)
            const localStream = await webRTCService.getUserMedia();

            return localStream;
        } catch (error) {
            console.error('Failed to initialize WebRTC:', error);
            throw error;
        }
    }, [setupWebRTCListeners]);

    // Start connection with a specific user
    const connectToUser = useCallback(async (userId: string) => {
        try {
            await webRTCService.createOffer(userId);
        } catch (error) {
            console.error(`Failed to connect to user ${userId}:`, error);
        }
    }, []);

    // Toggle media controls
    const toggleAudio = useCallback((enabled: boolean) => {
        webRTCService.toggleAudio(enabled);
    }, []);

    const toggleVideo = useCallback((enabled: boolean) => {
        webRTCService.toggleVideo(enabled);
    }, []);

    // Screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const screenStream = await webRTCService.startScreenShare();

            // Replace video track in all peer connections
            const videoTrack = screenStream.getVideoTracks()[0];
            await webRTCService.replaceVideoTrack(videoTrack);

            return screenStream;
        } catch (error) {
            console.error('Failed to start screen share:', error);
            throw error;
        }
    }, []);

    const stopScreenShare = useCallback(async () => {
        webRTCService.stopScreenShare();

        // Replace with camera video track
        const localStream = webRTCService.getLocalStream();
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                await webRTCService.replaceVideoTrack(videoTrack);
            }
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        webRTCService.cleanup();
    }, []);

    return {
        initializeWebRTC,
        connectToUser,
        toggleAudio,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        cleanup,

        // Direct access to service methods if needed
        getLocalStream: () => webRTCService.getLocalStream(),
        getRemoteStream: (userId: string) => webRTCService.getRemoteStream(userId),
        getAllRemoteStreams: () => webRTCService.getAllRemoteStreams(),
        isAudioEnabled: () => webRTCService.isAudioEnabled(),
        isVideoEnabled: () => webRTCService.isVideoEnabled(),
    };
}