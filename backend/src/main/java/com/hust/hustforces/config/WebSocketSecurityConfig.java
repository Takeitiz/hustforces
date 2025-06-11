// backend/src/main/java/com/hust/hustforces/config/WebSocketSecurityConfig.java
package com.hust.hustforces.config;

import com.hust.hustforces.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
@Slf4j
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                // Only process CONNECT messages
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Get the Authorization header
                    String authorization = accessor.getFirstNativeHeader("Authorization");

                    log.debug("WebSocket CONNECT - Authorization header: {}",
                            authorization != null ? "present" : "missing");

                    if (authorization != null && authorization.startsWith("Bearer ")) {
                        String token = authorization.substring(7);

                        try {
                            // Validate the token
                            if (jwtTokenProvider.validateToken(token)) {
                                // Get authentication from token
                                Authentication authentication =
                                        jwtTokenProvider.getAuthentication(token);

                                // Set the user in the WebSocket session
                                accessor.setUser(authentication);

                                log.info("WebSocket authentication successful for user: {}",
                                        authentication.getName());
                            } else {
                                log.warn("Invalid JWT token in WebSocket connection");
                            }
                        } catch (Exception e) {
                            log.error("Error processing JWT token in WebSocket connection", e);
                        }
                    } else {
                        log.warn("No valid Authorization header in WebSocket CONNECT");
                    }
                }

                return message;
            }
        });
    }
}