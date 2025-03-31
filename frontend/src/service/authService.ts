import { apiClient } from "../api/client.ts"

export interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    email: string;
    confirmPassword: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

/**
 * Service for handling authentication-related API calls
 */
const authService = {
    /**
     * Login user with credentials
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    /**
     * Register a new user
     */
    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },

    /**
     * Logout the current user
     */
    logout: (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    /**
     * Get the current user from local storage
     */
    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr) as User;
        } catch {
            return null;
        }
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn: (): boolean => {
        return !!localStorage.getItem('token');
    },

    /**
     * Get the auth token
     */
    getToken: (): string | null => {
        return localStorage.getItem('token');
    }
};

export default authService;