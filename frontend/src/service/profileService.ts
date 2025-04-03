import {UserProfile} from "../types/profile.ts";
import {apiClient} from "../api/client.ts";

/**
 * Service for handling user profile API calls
 */
const profileService = {
    /**
     * Get profile details for a specific user
     *
     * @param {string} username - Username to fetch profile for
     * @returns {Promise<UserProfile>} User profile data
     */
    getUserProfile: async (username: string): Promise<UserProfile> => {
        try {
            const response = await apiClient.get<UserProfile>(`/profile/${username}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    /**
     * Get profile details for the currently logged in user
     *
     * @returns {Promise<UserProfile>} Current user profile data
     */
    getMyProfile: async (): Promise<UserProfile> => {
        try {
            const response = await apiClient.get<UserProfile>('/profile/me');
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },
}

export default profileService;