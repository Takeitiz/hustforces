import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface MediaDeviceInfo {
    deviceId: string;
    label: string;
    kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

interface MediaDeviceState {
    audioDevices: MediaDeviceInfo[];
    videoDevices: MediaDeviceInfo[];
    selectedAudioDevice: string | null;
    selectedVideoDevice: string | null;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    audioLevel: number;
}

interface UseMediaDevicesOptions {
    onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
    audioLevelInterval?: number;
}

export function useMediaDevices(options: UseMediaDevicesOptions = {}) {
    const { onDeviceChange, audioLevelInterval = 100 } = options;

    const [state, setState] = useState<MediaDeviceState>({
        audioDevices: [],
        videoDevices: [],
        selectedAudioDevice: null,
        selectedVideoDevice: null,
        isAudioEnabled: false,
        isVideoEnabled: false,
        audioLevel: 0
    });

    const [isLoading, setIsLoading] = useState(false);
    const [permissionsGranted, setPermissionsGranted] = useState({
        audio: false,
        video: false
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Get available media devices
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioDevices = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
                    kind: 'audioinput' as const
                }));

            const videoDevices = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
                    kind: 'videoinput' as const
                }));

            setState(prev => ({
                ...prev,
                audioDevices,
                videoDevices,
                // Set default devices if not already selected
                selectedAudioDevice: prev.selectedAudioDevice || audioDevices[0]?.deviceId || null,
                selectedVideoDevice: prev.selectedVideoDevice || videoDevices[0]?.deviceId || null
            }));

            onDeviceChange?.(devices as MediaDeviceInfo[]);

            return { audioDevices, videoDevices };
        } catch (error) {
            console.error('Failed to enumerate devices:', error);
            return { audioDevices: [], videoDevices: [] };
        }
    }, [onDeviceChange]);

    // Request media permissions
    const requestPermissions = useCallback(async (constraints: MediaStreamConstraints) => {
        try {
            setIsLoading(true);

            // Request permissions
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop all tracks immediately - we just wanted permissions
            stream.getTracks().forEach(track => track.stop());

            setPermissionsGranted({
                audio: constraints.audio ? true : permissionsGranted.audio,
                video: constraints.video ? true : permissionsGranted.video
            });

            // Refresh device list after permissions granted
            await getDevices();

            return true;
        } catch (error: any) {
            console.error('Failed to get media permissions:', error);

            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                toast.error('Permission denied. Please allow access to camera/microphone.');
            } else if (error.name === 'NotFoundError') {
                toast.error('No camera or microphone found.');
            } else {
                toast.error('Failed to access media devices.');
            }

            return false;
        } finally {
            setIsLoading(false);
        }
    }, [permissionsGranted, getDevices]);

    // Get media stream with selected devices
    const getMediaStream = useCallback(async (
        audio: boolean = true,
        video: boolean = true
    ): Promise<MediaStream | null> => {
        try {
            const constraints: MediaStreamConstraints = {};

            if (audio) {
                constraints.audio = state.selectedAudioDevice
                    ? { deviceId: { exact: state.selectedAudioDevice } }
                    : true;
            }

            if (video) {
                constraints.video = state.selectedVideoDevice
                    ? {
                        deviceId: { exact: state.selectedVideoDevice },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    }
                    : {
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 },
                        frameRate: { ideal: 30, max: 60 }
                    };
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            setState(prev => ({
                ...prev,
                isAudioEnabled: audio,
                isVideoEnabled: video
            }));

            // Set up audio level monitoring if audio is enabled
            if (audio) {
                setupAudioLevelMonitoring(stream);
            }

            return stream;
        } catch (error) {
            console.error('Failed to get media stream:', error);
            toast.error('Failed to access camera/microphone');
            return null;
        }
    }, [state.selectedAudioDevice, state.selectedVideoDevice]);

    // Set up audio level monitoring
    const setupAudioLevelMonitoring = useCallback((stream: MediaStream) => {
        try {
            // Create audio context and analyser
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            // Connect stream to analyser
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            // Start monitoring audio levels
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

            const updateAudioLevel = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average volume
                const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                const normalizedLevel = Math.min(100, (average / 128) * 100);

                setState(prev => ({ ...prev, audioLevel: normalizedLevel }));
            };

            audioLevelIntervalRef.current = setInterval(updateAudioLevel, audioLevelInterval);
        } catch (error) {
            console.error('Failed to set up audio monitoring:', error);
        }
    }, [audioLevelInterval]);

    // Toggle audio
    const toggleAudio = useCallback((enabled?: boolean) => {
        if (!streamRef.current) return;

        const newState = enabled !== undefined ? enabled : !state.isAudioEnabled;

        streamRef.current.getAudioTracks().forEach(track => {
            track.enabled = newState;
        });

        setState(prev => ({ ...prev, isAudioEnabled: newState }));

        // Stop or restart audio monitoring
        if (!newState && audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
            setState(prev => ({ ...prev, audioLevel: 0 }));
        } else if (newState && !audioLevelIntervalRef.current) {
            setupAudioLevelMonitoring(streamRef.current);
        }
    }, [state.isAudioEnabled, setupAudioLevelMonitoring]);

    // Toggle video
    const toggleVideo = useCallback((enabled?: boolean) => {
        if (!streamRef.current) return;

        const newState = enabled !== undefined ? enabled : !state.isVideoEnabled;

        streamRef.current.getVideoTracks().forEach(track => {
            track.enabled = newState;
        });

        setState(prev => ({ ...prev, isVideoEnabled: newState }));
    }, [state.isVideoEnabled]);

    // Switch audio device
    const switchAudioDevice = useCallback(async (deviceId: string) => {
        setState(prev => ({ ...prev, selectedAudioDevice: deviceId }));

        // If stream is active, replace audio track
        if (streamRef.current && state.isAudioEnabled) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: deviceId } }
                });

                const oldTrack = streamRef.current.getAudioTracks()[0];
                const newTrack = newStream.getAudioTracks()[0];

                if (oldTrack) {
                    streamRef.current.removeTrack(oldTrack);
                    oldTrack.stop();
                }

                streamRef.current.addTrack(newTrack);

                // Update audio monitoring
                if (audioContextRef.current) {
                    setupAudioLevelMonitoring(streamRef.current);
                }

                toast.success('Audio device switched');
            } catch (error) {
                console.error('Failed to switch audio device:', error);
                toast.error('Failed to switch audio device');
            }
        }
    }, [state.isAudioEnabled, setupAudioLevelMonitoring]);

    // Switch video device
    const switchVideoDevice = useCallback(async (deviceId: string) => {
        setState(prev => ({ ...prev, selectedVideoDevice: deviceId }));

        // If stream is active, replace video track
        if (streamRef.current && state.isVideoEnabled) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: deviceId },
                        width: { min: 640, ideal: 1280, max: 1920 },
                        height: { min: 480, ideal: 720, max: 1080 }
                    }
                });

                const oldTrack = streamRef.current.getVideoTracks()[0];
                const newTrack = newStream.getVideoTracks()[0];

                if (oldTrack) {
                    streamRef.current.removeTrack(oldTrack);
                    oldTrack.stop();
                }

                streamRef.current.addTrack(newTrack);

                toast.success('Video device switched');
            } catch (error) {
                console.error('Failed to switch video device:', error);
                toast.error('Failed to switch video device');
            }
        }
    }, [state.isVideoEnabled]);

    // Stop all media
    const stopAllMedia = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current);
            audioLevelIntervalRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
            analyserRef.current = null;
        }

        setState(prev => ({
            ...prev,
            isAudioEnabled: false,
            isVideoEnabled: false,
            audioLevel: 0
        }));
    }, []);

    // Listen for device changes
    useEffect(() => {
        const handleDeviceChange = () => {
            getDevices();
        };

        navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

        // Initial device enumeration
        getDevices();

        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
        };
    }, [getDevices]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllMedia();
        };
    }, [stopAllMedia]);

    return {
        // State
        ...state,
        isLoading,
        permissionsGranted,
        currentStream: streamRef.current,

        // Actions
        requestPermissions,
        getMediaStream,
        toggleAudio,
        toggleVideo,
        switchAudioDevice,
        switchVideoDevice,
        stopAllMedia,
        refreshDevices: getDevices,

        // Utilities
        hasAudioDevice: state.audioDevices.length > 0,
        hasVideoDevice: state.videoDevices.length > 0,
        isMediaActive: state.isAudioEnabled || state.isVideoEnabled
    };
}