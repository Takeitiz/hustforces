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

    /**
     * Get the current authenticated user's ID
     * @return The current user's ID
     */
    public String getCurrentUserId() {
        return getCurrentUser().getId();
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
