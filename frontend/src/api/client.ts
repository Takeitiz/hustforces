import axios from "axios"

// Create a custom event for auth errors that the app can listen for
export const AUTH_ERROR_EVENT = "hustforces_auth_error"

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
})

// Function to get a fresh token
const getFreshToken = (): string | null => {
    const token = localStorage.getItem("token")
    if (!token) return null

    try {
        // Basic JWT validation
        const parts = token.split(".")
        if (parts.length !== 3) return null

        const payload = JSON.parse(atob(parts[1]))
        const currentTime = Math.floor(Date.now() / 1000)

        // Check if token is expired
        if (payload.exp && payload.exp < currentTime) {
            return null
        }

        return token
    } catch (error) {
        console.error("[API Client] Error validating token:", error)
        return null
    }
}

apiClient.interceptors.request.use(
    (config) => {
        const token = getFreshToken()
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        } else {
            // Remove authorization header if no valid token
            delete config.headers.Authorization
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
            console.error("[API Client] Unauthorized request detected")

            // Clear local storage if unauthorized
            localStorage.removeItem("token")
            localStorage.removeItem("user")

            // Dispatch a custom event that the app can listen for
            // This avoids direct DOM manipulation and lets React handle navigation
            window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT))
        }
        return Promise.reject(error)
    },
)
