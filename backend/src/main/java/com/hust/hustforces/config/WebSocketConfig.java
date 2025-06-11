// backend/src/main/java/com/hust/hustforces/config/WebSocketConfig.java
package com.hust.hustforces.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topic and queue destinations
        config.enableSimpleBroker("/topic", "/queue");

        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");

        // Set user destination prefix for sending messages to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://*")
                .withSockJS();

        // Additional endpoint specifically for code rooms (optional)
        registry.addEndpoint("/ws-coderoom")
                .setAllowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://*")
                .withSockJS();
    }
}