import { WebRTCConfigDto, WebRTCSignalDto } from '../types/codeRoom';

interface PeerConnectionInfo {
    connection: RTCPeerConnection;
    remoteStream: MediaStream;
    dataChannel?: RTCDataChannel;
}

type MediaStreamCallback = (stream: MediaStream, userId: string) => void;
type TrackCallback = (track: MediaStreamTrack, stream: MediaStream, userId: string) => void;
type DataChannelCallback = (data: any, userId: string) => void;

class WebRTCService {
    private peerConnections: Map<string, PeerConnectionInfo> = new Map();
    private localStream: MediaStream | null = null;
    private screenStream: MediaStream | null = null;
    private config: RTCConfiguration | null = null;

    // Connection state tracking - NEW
    private connectionStates: Map<string, RTCPeerConnectionState> = new Map();
    private connectionRetries: Map<string, number> = new Map();
    private readonly MAX_RETRIES = 3;

    // Callbacks
    private onRemoteStreamCallback: MediaStreamCallback | null = null;
    private onRemoteTrackCallback: TrackCallback | null = null;
    private onDataMessageCallback: DataChannelCallback | null = null;
    private onPeerDisconnectedCallback: ((userId: string) => void) | null = null;
    private onConnectionStateChangeCallback: ((userId: string, state: RTCPeerConnectionState) => void) | null = null;

    /**
     * Initialize WebRTC with configuration from server
     */
    initialize(webrtcConfig: WebRTCConfigDto): void {
        const iceServers: RTCIceServer[] = [
            { urls: webrtcConfig.iceServers },
            { urls: webrtcConfig.stunServer }
        ];

        if (webrtcConfig.turnServer && webrtcConfig.turnUsername && webrtcConfig.turnCredential) {
            iceServers.push({
                urls: webrtcConfig.turnServer,
                username: webrtcConfig.turnUsername,
                credential: webrtcConfig.turnCredential
            });
        }

        this.config = {
            iceServers,
            iceCandidatePoolSize: 10,
        };
    }

    /**
     * Get user media (camera and microphone)
     */
    async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
        try {
            const defaultConstraints: MediaStreamConstraints = {
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            };

            this.localStream = await navigator.mediaDevices.getUserMedia(
                constraints || defaultConstraints
            );

            return this.localStream;
        } catch (error) {
            console.error('Failed to get user media:', error);
            throw error;
        }
    }

    /**
     * Start screen sharing
     */
    async startScreenShare(): Promise<MediaStream> {
        try {
            const constraints: DisplayMediaStreamOptions = {
                video: {
                    displaySurface: 'monitor'
                } as MediaTrackConstraints,
                audio: false
            };

            this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);

            // Handle screen share ending
            this.screenStream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };

            return this.screenStream;
        } catch (error) {
            console.error('Failed to start screen share:', error);
            throw error;
        }
    }

    /**
     * Stop screen sharing
     */
    stopScreenShare(): void {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
    }

    /**
     * Create peer connection for a remote user
     */
    async createPeerConnection(remoteUserId: string): Promise<RTCPeerConnection> {
        if (!this.config) {
            throw new Error('WebRTC not initialized. Call initialize() first.');
        }

        const pc = new RTCPeerConnection(this.config);
        const remoteStream = new MediaStream();

        // Set up event handlers
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate(remoteUserId, event.candidate);
            }
        };

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });

            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(remoteStream, remoteUserId);
            }

            if (this.onRemoteTrackCallback) {
                this.onRemoteTrackCallback(event.track, event.streams[0], remoteUserId);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state for ${remoteUserId}: ${pc.connectionState}`);

            // Track connection state
            this.connectionStates.set(remoteUserId, pc.connectionState);

            if (this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback(remoteUserId, pc.connectionState);
            }

            if (pc.connectionState === 'failed') {
                this.handleConnectionFailure(remoteUserId);
            } else if (pc.connectionState === 'closed') {
                this.removePeerConnection(remoteUserId);
                if (this.onPeerDisconnectedCallback) {
                    this.onPeerDisconnectedCallback(remoteUserId);
                }
            }
        };

        // Create data channel for additional communication
        const dataChannel = pc.createDataChannel('coderoom-data', {
            ordered: true
        });

        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${remoteUserId}`);
        };

        dataChannel.onmessage = (event) => {
            if (this.onDataMessageCallback) {
                try {
                    const data = JSON.parse(event.data);
                    this.onDataMessageCallback(data, remoteUserId);
                } catch (e) {
                    this.onDataMessageCallback(event.data, remoteUserId);
                }
            }
        };

        // Add local stream tracks if available
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream!);
            });
        }

        this.peerConnections.set(remoteUserId, {
            connection: pc,
            remoteStream,
            dataChannel
        });

        return pc;
    }

    /**
     * Get or create peer connection
     */
    private async getOrCreatePeerConnection(remoteUserId: string): Promise<RTCPeerConnection> {
        const existing = this.peerConnections.get(remoteUserId);
        if (existing) {
            return existing.connection;
        }
        return this.createPeerConnection(remoteUserId);
    }

    /**
     * Handle incoming WebRTC signal - UPDATED WITH ERROR HANDLING
     */
    async handleSignal(signal: WebRTCSignalDto): Promise<void> {
        const { type, fromUserId, data } = signal;

        if (!fromUserId) {
            console.error('Invalid signal: missing fromUserId');
            throw new Error('Invalid signal: missing fromUserId');
        }

        try {
            const pc = await this.getOrCreatePeerConnection(fromUserId);

            switch (type) {
                case 'offer':
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(data));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        this.sendSignal({
                            type: 'answer',
                            toUserId: fromUserId,
                            data: answer
                        });
                    } catch (error) {
                        console.error(`Failed to handle offer from ${fromUserId}:`, error);
                        // Notify peer about the failure
                        this.sendSignal({
                            type: 'error' as any,
                            toUserId: fromUserId,
                            data: { error: 'Failed to process offer' }
                        });
                        throw error;
                    }
                    break;

                case 'answer':
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(data));
                    } catch (error) {
                        console.error(`Failed to handle answer from ${fromUserId}:`, error);
                        this.handleConnectionFailure(fromUserId);
                        throw error;
                    }
                    break;

                case 'ice-candidate':
                    try {
                        if (pc.remoteDescription) {
                            await pc.addIceCandidate(new RTCIceCandidate(data));
                        } else {
                            // Queue ICE candidate if remote description not set yet
                            console.warn('Queuing ICE candidate - remote description not ready');
                            // You could implement ICE candidate queuing here if needed
                        }
                    } catch (error) {
                        console.error(`Failed to add ICE candidate from ${fromUserId}:`, error);
                        // ICE failures are common, don't throw
                    }
                    break;

                case 'error' as any:
                    console.error(`Received error from ${fromUserId}:`, data);
                    this.handleConnectionFailure(fromUserId);
                    break;
            }
        } catch (error) {
            console.error(`Failed to handle ${type} signal from ${fromUserId}:`, error);
            this.handleConnectionFailure(fromUserId);
            throw error;
        }
    }

    /**
     * Handle connection failure with retry logic - NEW
     */
    private async handleConnectionFailure(userId: string): Promise<void> {
        const retries = this.connectionRetries.get(userId) || 0;

        if (retries < this.MAX_RETRIES) {
            console.log(`Retrying connection to ${userId} (attempt ${retries + 1}/${this.MAX_RETRIES})`);
            this.connectionRetries.set(userId, retries + 1);

            // Clean up existing connection
            this.removePeerConnection(userId);

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));

            // Retry connection
            try {
                await this.createOffer(userId);
            } catch (error) {
                console.error(`Retry failed for ${userId}:`, error);
            }
        } else {
            console.error(`Max retries reached for ${userId}, giving up`);
            this.removePeerConnection(userId);
            if (this.onPeerDisconnectedCallback) {
                this.onPeerDisconnectedCallback(userId);
            }
        }
    }

    /**
     * Create and send offer to a remote user
     */
    async createOffer(remoteUserId: string): Promise<void> {
        const pc = await this.getOrCreatePeerConnection(remoteUserId);

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });

        await pc.setLocalDescription(offer);

        this.sendSignal({
            type: 'offer',
            toUserId: remoteUserId,
            data: offer
        });
    }

    /**
     * Toggle audio on/off
     */
    toggleAudio(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Toggle video on/off
     */
    toggleVideo(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Replace video track (for screen sharing)
     */
    async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
        const videoSenders: RTCRtpSender[] = [];

        this.peerConnections.forEach(({ connection }) => {
            const sender = connection.getSenders().find(
                s => s.track && s.track.kind === 'video'
            );
            if (sender) {
                videoSenders.push(sender);
            }
        });

        await Promise.all(videoSenders.map(sender => sender.replaceTrack(newTrack)));
    }

    /**
     * Send data through data channel
     */
    sendData(data: any, userId?: string): void {
        const message = typeof data === 'string' ? data : JSON.stringify(data);

        if (userId) {
            const peer = this.peerConnections.get(userId);
            if (peer?.dataChannel?.readyState === 'open') {
                peer.dataChannel.send(message);
            }
        } else {
            // Broadcast to all peers
            this.peerConnections.forEach(({ dataChannel }) => {
                if (dataChannel?.readyState === 'open') {
                    dataChannel.send(message);
                }
            });
        }
    }

    /**
     * Get connection statistics
     */
    async getConnectionStats(userId: string): Promise<RTCStatsReport | null> {
        const peer = this.peerConnections.get(userId);
        if (!peer) return null;

        return peer.connection.getStats();
    }

    /**
     * Remove peer connection
     */
    removePeerConnection(userId: string): void {
        const peer = this.peerConnections.get(userId);
        if (peer) {
            peer.dataChannel?.close();
            peer.connection.close();
            peer.remoteStream.getTracks().forEach(track => track.stop());
            this.peerConnections.delete(userId);
        }

        // Clean up retry count
        this.connectionRetries.delete(userId);
        this.connectionStates.delete(userId);
    }

    /**
     * Clean up all connections
     */
    cleanup(): void {
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Stop screen share
        this.stopScreenShare();

        // Close all peer connections
        this.peerConnections.forEach((_, userId) => {
            this.removePeerConnection(userId);
        });

        // Clear state maps
        this.connectionRetries.clear();
        this.connectionStates.clear();

        // Clear callbacks
        this.onRemoteStreamCallback = null;
        this.onRemoteTrackCallback = null;
        this.onDataMessageCallback = null;
        this.onPeerDisconnectedCallback = null;
        this.onConnectionStateChangeCallback = null;
        this.signalSender = null;
    }

    // ============ Callbacks ============

    /**
     * Callback for when ICE candidate is generated
     */
    private onIceCandidate(remoteUserId: string, candidate: RTCIceCandidate): void {
        this.sendSignal({
            type: 'ice-candidate',
            toUserId: remoteUserId,
            data: candidate
        });
    }

    // Signal sender callback
    private signalSender: ((signal: WebRTCSignalDto) => void) | null = null;

    /**
     * Set the signal sender callback
     * This should be set to send signals through WebSocket
     */
    setSignalSender(sender: (signal: WebRTCSignalDto) => void): void {
        this.signalSender = sender;
    }

    /**
     * Send signal through the configured sender
     */
    private sendSignal(signal: WebRTCSignalDto): void {
        if (this.signalSender) {
            this.signalSender(signal);
        } else {
            console.error('Signal sender not configured. Call setSignalSender() first.');
        }
    }

    /**
     * Set callback for remote stream
     */
    setOnRemoteStream(callback: MediaStreamCallback): void {
        this.onRemoteStreamCallback = callback;
    }

    /**
     * Set callback for remote track
     */
    setOnRemoteTrack(callback: TrackCallback): void {
        this.onRemoteTrackCallback = callback;
    }

    /**
     * Set callback for data channel messages
     */
    setOnDataMessage(callback: DataChannelCallback): void {
        this.onDataMessageCallback = callback;
    }

    /**
     * Set callback for peer disconnection
     */
    setOnPeerDisconnected(callback: (userId: string) => void): void {
        this.onPeerDisconnectedCallback = callback;
    }

    /**
     * Set callback for connection state changes
     */
    setOnConnectionStateChange(callback: (userId: string, state: RTCPeerConnectionState) => void): void {
        this.onConnectionStateChangeCallback = callback;
    }

    // ============ Getters ============

    /**
     * Get local stream
     */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /**
     * Get screen stream
     */
    getScreenStream(): MediaStream | null {
        return this.screenStream;
    }

    /**
     * Get remote stream for a user
     */
    getRemoteStream(userId: string): MediaStream | null {
        return this.peerConnections.get(userId)?.remoteStream || null;
    }

    /**
     * Get all remote streams
     */
    getAllRemoteStreams(): Map<string, MediaStream> {
        const streams = new Map<string, MediaStream>();
        this.peerConnections.forEach((peer, userId) => {
            streams.set(userId, peer.remoteStream);
        });
        return streams;
    }

    /**
     * Check if audio is enabled
     */
    isAudioEnabled(): boolean {
        if (!this.localStream) return false;
        const audioTrack = this.localStream.getAudioTracks()[0];
        return audioTrack ? audioTrack.enabled : false;
    }

    /**
     * Check if video is enabled
     */
    isVideoEnabled(): boolean {
        if (!this.localStream) return false;
        const videoTrack = this.localStream.getVideoTracks()[0];
        return videoTrack ? videoTrack.enabled : false;
    }
}

// Create singleton instance
const webRTCService = new WebRTCService();
export default webRTCService;