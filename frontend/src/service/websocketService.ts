import {Client} from "@stomp/stompjs";
import SockJS from 'sockjs-client';

class WebSocketService {
    private client: Client | null = null;
    private subscriptions: { [id: string]: { unsubscribe: () => void } } = {};
    private baseUrl: string;

    constructor() {
        this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    }

    connect(onConnect?: () => void, onError?: (error: any) => void): void {
        // Create and configure the STOMP client
        this.client = new Client({
            webSocketFactory: () => new SockJS(`${this.baseUrl}/ws`),
            debug: function (str) {
                console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        // Set up event handlers
        if (onConnect) {
            this.client.onConnect = onConnect;
        }

        if (onError) {
            this.client.onStompError = onError;
        }

        // Connect to the WebSocket server
        this.client.activate();
    }

    disconnect(): void {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.subscriptions = {};
        }
    }

    subscribe(destination: string, callback: (message: any) => void): string {
        if (!this.client || !this.client.connected) {
            console.error('WebSocket not connected');
            return '';
        }

        const subscription = this.client.subscribe(destination, (message) => {
            const payload = JSON.parse(message.body);
            callback(payload);
        });

        const id = subscription.id;
        this.subscriptions[id] = subscription;
        return id;
    }

    unsubscribe(id: string): void {
        if (this.subscriptions[id]) {
            this.subscriptions[id].unsubscribe();
            delete this.subscriptions[id];
        }
    }

    send(destination: string, body: any): void {
        if (!this.client || !this.client.connected) {
            console.error('WebSocket not connected');
            return;
        }

        this.client.publish({
            destination,
            body: JSON.stringify(body),
        });
    }

    isConnected(): boolean {
        return !!this.client && this.client.connected;
    }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;

