import type { WebRTCConfigDto, WebRTCSignalDto } from "../types/codeRoom"

interface PeerConnectionInfo {
    connection: RTCPeerConnection
    remoteStream: MediaStream
    dataChannel?: RTCDataChannel
}

type MediaStreamCallback = (stream: MediaStream, userId: string) => void
type TrackCallback = (track: MediaStreamTrack, stream: MediaStream, userId: string) => void
type DataChannelCallback = (data: any, userId: string) => void

class WebRTCService {
    private peerConnections: Map<string, PeerConnectionInfo> = new Map()
    private localStream: MediaStream | null = null
    private screenStream: MediaStream | null = null
    private config: RTCConfiguration | null = null

    // Connection state tracking
    private connectionStates: Map<string, RTCPeerConnectionState> = new Map()
    private connectionRetries: Map<string, number> = new Map()
    private readonly MAX_RETRIES = 3

    // Callbacks
    private onRemoteStreamCallback: MediaStreamCallback | null = null
    private onRemoteTrackCallback: TrackCallback | null = null
    private onDataMessageCallback: DataChannelCallback | null = null
    private onPeerDisconnectedCallback: ((userId: string) => void) | null = null
    private onConnectionStateChangeCallback: ((userId: string, state: RTCPeerConnectionState) => void) | null = null

    initialize(webrtcConfig: WebRTCConfigDto): void {
        const iceServers: RTCIceServer[] = [{ urls: webrtcConfig.iceServers }, { urls: webrtcConfig.stunServer }]

        if (webrtcConfig.turnServer && webrtcConfig.turnUsername && webrtcConfig.turnCredential) {
            iceServers.push({
                urls: webrtcConfig.turnServer,
                username: webrtcConfig.turnUsername,
                credential: webrtcConfig.turnCredential,
            })
        }

        this.config = {
            iceServers,
            iceCandidatePoolSize: 10,
        }
        console.log("[WebRTCService] Initialized with config:", this.config)
    }

    async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
        const defaultConstraints: MediaStreamConstraints = {
            video: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 60 },
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100, // Some browsers might be picky about this
            },
        }

        const requestedConstraints = constraints || defaultConstraints
        console.log("[WebRTCService] Attempting getUserMedia with constraints:", requestedConstraints)

        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(requestedConstraints)
            console.log("[WebRTCService] getUserMedia successful with primary constraints.")
            return this.localStream
        } catch (error: any) {
            console.warn(`[WebRTCService] getUserMedia failed with primary constraints: ${error.name} - ${error.message}`)

            // Try with audio only if video failed or if it's a NotFoundError
            if (requestedConstraints.video && (error.name === "NotFoundError" || error.name === "DevicesNotFoundError")) {
                console.log("[WebRTCService] Retrying getUserMedia with audio-only constraints.")
                try {
                    const audioOnlyConstraints: MediaStreamConstraints = { audio: requestedConstraints.audio, video: false }
                    this.localStream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints)
                    console.log("[WebRTCService] getUserMedia successful with audio-only constraints.")
                    return this.localStream
                } catch (audioError: any) {
                    console.warn(
                        `[WebRTCService] getUserMedia failed with audio-only constraints: ${audioError.name} - ${audioError.message}`,
                    )
                    // If audio-only also fails, re-throw the original error or a more specific one
                    throw error // Re-throw original error to be handled upstream
                }
            }
            // Try with video only if audio failed (less common for NotFoundError but possible)
            else if (
                requestedConstraints.audio &&
                (error.name === "NotFoundError" || error.name === "DevicesNotFoundError")
            ) {
                console.log("[WebRTCService] Retrying getUserMedia with video-only constraints.")
                try {
                    const videoOnlyConstraints: MediaStreamConstraints = { audio: false, video: requestedConstraints.video }
                    this.localStream = await navigator.mediaDevices.getUserMedia(videoOnlyConstraints)
                    console.log("[WebRTCService] getUserMedia successful with video-only constraints.")
                    return this.localStream
                } catch (videoError: any) {
                    console.warn(
                        `[WebRTCService] getUserMedia failed with video-only constraints: ${videoError.name} - ${videoError.message}`,
                    )
                    throw error
                }
            }

            // If not a NotFoundError, or if retries failed, re-throw the original error.
            throw error
        }
    }

    async startScreenShare(): Promise<MediaStream> {
        try {
            console.log("[WebRTCService] Attempting startScreenShare.")
            const constraints: DisplayMediaStreamOptions = {
                video: {
                    displaySurface: "monitor", // 'window', 'tab', 'monitor'
                } as MediaTrackConstraints, // Added type assertion
                audio: false, // Typically screen share audio is handled separately or not captured
            }

            this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints)
            console.log("[WebRTCService] Screen share started.")

            this.screenStream.getVideoTracks()[0].onended = () => {
                console.log("[WebRTCService] Screen share ended by user.")
                this.stopScreenShare()
                // Optionally, notify the application to switch back to camera
            }

            return this.screenStream
        } catch (error: any) {
            console.error(`[WebRTCService] Failed to start screen share: ${error.name} - ${error.message}`)
            throw error
        }
    }

    stopScreenShare(): void {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach((track) => track.stop())
            this.screenStream = null
            console.log("[WebRTCService] Screen share stopped.")
        }
    }

    async createPeerConnection(remoteUserId: string): Promise<RTCPeerConnection> {
        if (!this.config) {
            console.error("[WebRTCService] WebRTC not initialized. Call initialize() first.")
            throw new Error("WebRTC not initialized. Call initialize() first.")
        }
        console.log(`[WebRTCService] Creating peer connection for ${remoteUserId}`)

        const pc = new RTCPeerConnection(this.config)
        const remoteStream = new MediaStream()

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // console.log(`[WebRTCService] ICE candidate for ${remoteUserId}:`, event.candidate);
                this.onIceCandidate(remoteUserId, event.candidate)
            }
        }

        pc.ontrack = (event) => {
            console.log(`[WebRTCService] Track received from ${remoteUserId}:`, event.track.kind)
            event.streams[0].getTracks().forEach((track) => {
                remoteStream.addTrack(track)
            })

            if (this.onRemoteStreamCallback) {
                this.onRemoteStreamCallback(remoteStream, remoteUserId)
            }

            if (this.onRemoteTrackCallback) {
                this.onRemoteTrackCallback(event.track, event.streams[0], remoteUserId)
            }
        }

        pc.onconnectionstatechange = () => {
            console.log(`[WebRTCService] Connection state for ${remoteUserId}: ${pc.connectionState}`)
            this.connectionStates.set(remoteUserId, pc.connectionState)

            if (this.onConnectionStateChangeCallback) {
                this.onConnectionStateChangeCallback(remoteUserId, pc.connectionState)
            }

            if (pc.connectionState === "failed") {
                this.handleConnectionFailure(remoteUserId)
            } else if (pc.connectionState === "disconnected" || pc.connectionState === "closed") {
                console.log(`[WebRTCService] Peer ${remoteUserId} disconnected or closed.`)
                this.removePeerConnection(remoteUserId)
                if (this.onPeerDisconnectedCallback) {
                    this.onPeerDisconnectedCallback(remoteUserId)
                }
            } else if (pc.connectionState === "connected") {
                console.log(`[WebRTCService] Peer ${remoteUserId} connected.`)
                this.connectionRetries.delete(remoteUserId) // Reset retries on successful connection
            }
        }

        pc.ondatachannel = (event) => {
            console.log(`[WebRTCService] Data channel received from ${remoteUserId}`)
            const dataChannel = event.channel
            dataChannel.onopen = () => console.log(`[WebRTCService] Data channel opened with ${remoteUserId}`)
            dataChannel.onmessage = (msgEvent) => {
                if (this.onDataMessageCallback) {
                    try {
                        const data = JSON.parse(msgEvent.data as string) // Added type assertion
                        this.onDataMessageCallback(data, remoteUserId)
                    } catch (e) {
                        this.onDataMessageCallback(msgEvent.data, remoteUserId)
                    }
                }
            }
            // Store it if needed, though often the one created by createOffer is primary
            const peerInfo = this.peerConnections.get(remoteUserId)
            if (peerInfo && !peerInfo.dataChannel) {
                peerInfo.dataChannel = dataChannel
            }
        }

        // Create data channel for additional communication (if this side initiates)
        // const dataChannel = pc.createDataChannel('coderoom-data', { ordered: true });
        // dataChannel.onopen = () => console.log(`[WebRTCService] Data channel created and opened with ${remoteUserId}`);
        // dataChannel.onmessage = (event) => { /* ... */ };

        if (this.localStream) {
            console.log(`[WebRTCService] Adding local stream tracks to PC for ${remoteUserId}`)
            this.localStream.getTracks().forEach((track) => {
                try {
                    pc.addTrack(track, this.localStream!)
                } catch (e) {
                    console.error(`[WebRTCService] Error adding track for ${remoteUserId}:`, e)
                }
            })
        } else {
            console.warn(`[WebRTCService] No local stream available to add tracks for ${remoteUserId}`)
        }

        this.peerConnections.set(remoteUserId, {
            connection: pc,
            remoteStream,
            // dataChannel // Set if created here, or by ondatachannel
        })

        return pc
    }

    private async getOrCreatePeerConnection(remoteUserId: string): Promise<RTCPeerConnection> {
        const existing = this.peerConnections.get(remoteUserId)
        if (existing) {
            return existing.connection
        }
        return this.createPeerConnection(remoteUserId)
    }

    async handleSignal(signal: WebRTCSignalDto): Promise<void> {
        const { type, fromUserId, data } = signal
        console.log(`[WebRTCService] Handling signal type '${type}' from ${fromUserId}`)

        if (!fromUserId) {
            console.error("[WebRTCService] Invalid signal: missing fromUserId")
            throw new Error("Invalid signal: missing fromUserId")
        }

        try {
            const pc = await this.getOrCreatePeerConnection(fromUserId)

            switch (type) {
                case "offer":
                    try {
                        console.log(`[WebRTCService] Setting remote description (offer) from ${fromUserId}`)
                        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit)) // Added type assertion
                        console.log(`[WebRTCService] Creating answer for ${fromUserId}`)
                        const answer = await pc.createAnswer()
                        await pc.setLocalDescription(answer)
                        this.sendSignal({
                            type: "answer",
                            toUserId: fromUserId,
                            data: answer,
                        })
                        console.log(`[WebRTCService] Sent answer to ${fromUserId}`)
                    } catch (error: any) {
                        console.error(`[WebRTCService] Failed to handle offer from ${fromUserId}: ${error.name} - ${error.message}`)
                        this.sendSignal({
                            type: "error" as any, // Consider defining 'error' in WebRTCSignalDto type
                            toUserId: fromUserId,
                            data: { error: "Failed to process offer", details: error.message },
                        })
                        throw error
                    }
                    break

                case "answer":
                    try {
                        console.log(`[WebRTCService] Setting remote description (answer) from ${fromUserId}`)
                        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit)) // Added type assertion
                        console.log(`[WebRTCService] Remote description (answer) set for ${fromUserId}`)
                    } catch (error: any) {
                        console.error(
                            `[WebRTCService] Failed to handle answer from ${fromUserId}: ${error.name} - ${error.message}`,
                        )
                        this.handleConnectionFailure(fromUserId) // Potentially retry
                        throw error
                    }
                    break

                case "ice-candidate":
                    try {
                        if (data && (data as RTCIceCandidateInit).candidate) {
                            // Check if data and candidate exist
                            if (pc.remoteDescription) {
                                // console.log(`[WebRTCService] Adding ICE candidate from ${fromUserId}`);
                                await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit))
                            } else {
                                console.warn(
                                    `[WebRTCService] Queuing ICE candidate from ${fromUserId} - remote description not set yet.`,
                                )
                                // Implement ICE candidate queuing if necessary
                            }
                        } else {
                            // console.log(`[WebRTCService] Received null ICE candidate from ${fromUserId}, signaling end of candidates.`);
                        }
                    } catch (error: any) {
                        console.error(
                            `[WebRTCService] Failed to add ICE candidate from ${fromUserId}: ${error.name} - ${error.message}`,
                        )
                    }
                    break

                case "error" as any: // Define 'error' type properly
                    console.error(`[WebRTCService] Received error signal from ${fromUserId}:`, data)
                    this.handleConnectionFailure(fromUserId)
                    break

                default:
                    console.warn(`[WebRTCService] Received unknown signal type: ${type}`)
            }
        } catch (error: any) {
            console.error(
                `[WebRTCService] General error handling signal type '${type}' from ${fromUserId}: ${error.name} - ${error.message}`,
            )
            this.handleConnectionFailure(fromUserId) // Attempt to recover or clean up
            // Do not re-throw here unless it's critical for the caller to know
        }
    }

    private async handleConnectionFailure(userId: string): Promise<void> {
        const retries = this.connectionRetries.get(userId) || 0
        console.log(`[WebRTCService] Handling connection failure for ${userId}, retries: ${retries}`)

        if (retries < this.MAX_RETRIES) {
            this.connectionRetries.set(userId, retries + 1)
            console.log(`[WebRTCService] Retrying connection to ${userId} (attempt ${retries + 1}/${this.MAX_RETRIES})`)

            this.removePeerConnection(userId, false) // Close existing but don't clear all retry info yet

            await new Promise((resolve) => setTimeout(resolve, 1000 * (retries + 1))) // Exponential backoff

            try {
                await this.createOffer(userId)
            } catch (error: any) {
                console.error(`[WebRTCService] Retry failed for ${userId}: ${error.name} - ${error.message}`)
                // If retry itself fails, it might lead to another call to handleConnectionFailure
            }
        } else {
            console.error(`[WebRTCService] Max retries reached for ${userId}. Giving up and cleaning up connection.`)
            this.removePeerConnection(userId, true) // Full cleanup
            if (this.onPeerDisconnectedCallback) {
                this.onPeerDisconnectedCallback(userId)
            }
        }
    }

    async createOffer(remoteUserId: string): Promise<void> {
        console.log(`[WebRTCService] Creating offer for ${remoteUserId}`)
        const pc = await this.getOrCreatePeerConnection(remoteUserId)

        // Ensure data channel exists
        const peerInfo = this.peerConnections.get(remoteUserId)
        if (peerInfo && !peerInfo.dataChannel) {
            console.log(`[WebRTCService] Creating data channel for ${remoteUserId} before offer.`)
            const dataChannel = pc.createDataChannel("coderoom-data", { ordered: true })
            dataChannel.onopen = () =>
                console.log(`[WebRTCService] Data channel (created by offerer) opened with ${remoteUserId}`)
            dataChannel.onmessage = (event) => {
                if (this.onDataMessageCallback) {
                    try {
                        const data = JSON.parse(event.data as string)
                        this.onDataMessageCallback(data, remoteUserId)
                    } catch (e) {
                        this.onDataMessageCallback(event.data, remoteUserId)
                    }
                }
            }
            peerInfo.dataChannel = dataChannel
        }

        const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
        })

        await pc.setLocalDescription(offer)
        console.log(`[WebRTCService] Offer created and local description set for ${remoteUserId}`)

        this.sendSignal({
            type: "offer",
            toUserId: remoteUserId,
            data: offer,
        })
    }

    toggleAudio(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach((track) => {
                track.enabled = enabled
            })
            console.log(`[WebRTCService] Audio ${enabled ? "enabled" : "disabled"}`)
        }
    }

    toggleVideo(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach((track) => {
                track.enabled = enabled
            })
            console.log(`[WebRTCService] Video ${enabled ? "enabled" : "disabled"}`)
        }
    }

    async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
        // Allow null to stop sending video
        console.log(`[WebRTCService] Replacing video track with:`, newTrack ? newTrack.kind : "null")
        this.peerConnections.forEach(async ({ connection }, userId) => {
            const sender = connection.getSenders().find((s) => s.track && s.track.kind === "video")
            if (sender) {
                try {
                    await sender.replaceTrack(newTrack)
                    console.log(`[WebRTCService] Video track replaced for ${userId}`)
                } catch (error) {
                    console.error(`[WebRTCService] Error replacing video track for ${userId}:`, error)
                }
            } else if (newTrack) {
                // If no sender exists, and we have a new track, add it.
                try {
                    connection.addTrack(newTrack, this.localStream!) // Assuming localStream contains this track
                    console.log(`[WebRTCService] Video track added for ${userId} as no sender existed.`)
                } catch (error) {
                    console.error(`[WebRTCService] Error adding new video track for ${userId}:`, error)
                }
            }
        })
    }

    sendData(data: any, userId?: string): void {
        const message = typeof data === "string" ? data : JSON.stringify(data)

        if (userId) {
            const peer = this.peerConnections.get(userId)
            if (peer?.dataChannel?.readyState === "open") {
                peer.dataChannel.send(message)
            } else {
                console.warn(`[WebRTCService] Data channel not open or not found for user ${userId}. Cannot send data.`)
            }
        } else {
            // Broadcast to all peers
            this.peerConnections.forEach(({ dataChannel }, peerId) => {
                if (dataChannel?.readyState === "open") {
                    dataChannel.send(message)
                } else {
                    console.warn(
                        `[WebRTCService] Data channel not open or not found for user ${peerId} during broadcast. Cannot send data.`,
                    )
                }
            })
        }
    }

    async getConnectionStats(userId: string): Promise<RTCStatsReport | null> {
        const peer = this.peerConnections.get(userId)
        if (!peer) return null
        return peer.connection.getStats()
    }

    removePeerConnection(userId: string, fullCleanup = true): void {
        const peer = this.peerConnections.get(userId)
        if (peer) {
            console.log(`[WebRTCService] Removing peer connection for ${userId}. Full cleanup: ${fullCleanup}`)
            peer.dataChannel?.close()
            peer.connection.close() // This will trigger onconnectionstatechange to 'closed'
            // remoteStream tracks are managed by the browser when connection closes
            this.peerConnections.delete(userId)
        }
        if (fullCleanup) {
            this.connectionRetries.delete(userId)
            this.connectionStates.delete(userId)
        }
    }

    cleanup(): void {
        console.log("[WebRTCService] Cleaning up all WebRTC resources.")
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => track.stop())
            this.localStream = null
        }
        this.stopScreenShare() // Also stops screenStream tracks

        this.peerConnections.forEach((_, userId) => {
            this.removePeerConnection(userId, true)
        })
        // Maps are cleared by removePeerConnection with fullCleanup

        this.onRemoteStreamCallback = null
        this.onRemoteTrackCallback = null
        this.onDataMessageCallback = null
        this.onPeerDisconnectedCallback = null
        this.onConnectionStateChangeCallback = null
        this.signalSender = null // Important to clear to prevent sending signals after cleanup
        console.log("[WebRTCService] WebRTC cleanup complete.")
    }

    private onIceCandidate(remoteUserId: string, candidate: RTCIceCandidate): void {
        this.sendSignal({
            type: "ice-candidate",
            toUserId: remoteUserId,
            data: candidate.toJSON(), // Send as JSON
        })
    }

    private signalSender: ((signal: WebRTCSignalDto) => void) | null = null

    setSignalSender(sender: (signal: WebRTCSignalDto) => void): void {
        this.signalSender = sender
    }

    private sendSignal(signal: WebRTCSignalDto): void {
        if (this.signalSender) {
            this.signalSender(signal)
        } else {
            console.error("[WebRTCService] Signal sender not configured. Call setSignalSender() first.")
        }
    }

    setOnRemoteStream(callback: MediaStreamCallback): void {
        this.onRemoteStreamCallback = callback
    }
    setOnRemoteTrack(callback: TrackCallback): void {
        this.onRemoteTrackCallback = callback
    }
    setOnDataMessage(callback: DataChannelCallback): void {
        this.onDataMessageCallback = callback
    }
    setOnPeerDisconnected(callback: (userId: string) => void): void {
        this.onPeerDisconnectedCallback = callback
    }
    setOnConnectionStateChange(callback: (userId: string, state: RTCPeerConnectionState) => void): void {
        this.onConnectionStateChangeCallback = callback
    }

    getLocalStream(): MediaStream | null {
        return this.localStream
    }
    getScreenStream(): MediaStream | null {
        return this.screenStream
    }
    getRemoteStream(userId: string): MediaStream | null {
        return this.peerConnections.get(userId)?.remoteStream || null
    }
    getAllRemoteStreams(): Map<string, MediaStream> {
        const streams = new Map<string, MediaStream>()
        this.peerConnections.forEach((peer, userId) => {
            streams.set(userId, peer.remoteStream)
        })
        return streams
    }
    isAudioEnabled(): boolean {
        if (!this.localStream) return false
        const audioTrack = this.localStream.getAudioTracks()[0]
        return audioTrack ? audioTrack.enabled : false
    }
    isVideoEnabled(): boolean {
        if (!this.localStream) return false
        const videoTrack = this.localStream.getVideoTracks()[0]
        return videoTrack ? videoTrack.enabled : false
    }
}

const webRTCService = new WebRTCService()
export default webRTCService
