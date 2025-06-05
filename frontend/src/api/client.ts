import axios from "axios";

// Create a custom event for auth errors that the app can listen for
export const AUTH_ERROR_EVENT = 'hustforces_auth_error';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
            // Clear local storage if unauthorized
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Dispatch a custom event that the app can listen for
            // This avoids direct DOM manipulation and lets React handle navigation
            window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
        }
        return Promise.reject(error);
    }
);