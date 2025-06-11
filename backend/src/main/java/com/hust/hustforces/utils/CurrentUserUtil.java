package com.hust.hustforces.utils;

import com.hust.hustforces.exception.ResourceNotFoundException;
import com.hust.hustforces.model.entity.User;
import com.hust.hustforces.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility class to get the current authenticated user
 */
@Component
@RequiredArgsConstructor
public class CurrentUserUtil {

    private final UserRepository userRepository;

    /**
     * Get the current authenticated user entity
     * @return The current user entity
     * @throws ResourceNotFoundException if the user doesn't exist
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null) {
            throw new IllegalStateException("No authentication found");
        }

        // For WebSocket, the principal name is the username
        String username = authentication.getName();

        // If it's already a user ID (for REST endpoints), return it
        if (username.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")) {
            return username;
        }

        // Otherwise, look up the user
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username))
                .getId();
    }

    /**
     * Check if the current user is authorized to perform an action on a resource
     * @param resourceOwnerId The ID of the resource owner
     * @return true if the current user is the resource owner
     */
    public boolean isResourceOwner(String resourceOwnerId) {
        return getCurrentUserId().equals(resourceOwnerId);
    }
}
