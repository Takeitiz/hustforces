"use client"

import type React from "react"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import { toast } from "react-toastify"
import authService, { type LoginCredentials, type User } from "../service/authService.ts"
import { useNavigate, useLocation } from "react-router-dom"
import { AUTH_ERROR_EVENT } from "../api/client.ts"

interface AuthContextType {
    user: User | null
    isLoggedIn: boolean
    loading: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    logout: () => void
    getValidToken: () => string | null
    refreshToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const currentUser = authService.getCurrentUser()
        if (currentUser) {
            setUser(currentUser)
        }
        setLoading(false)

        // Listen for auth errors from API client
        const handleAuthError = () => {
            console.log("[Auth] Authentication error detected, logging out user")
            // Only logout if not already on login page to prevent loops
            if (location.pathname !== '/login') {
                logout()
            }
        }

        window.addEventListener(AUTH_ERROR_EVENT, handleAuthError)

        return () => {
            window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError)
        }
    }, [location.pathname])

    /**
     * Get a valid token, refreshing if necessary
     */
    const getValidToken = (): string | null => {
        const token = localStorage.getItem("token")
        if (!token) {
            return null
        }

        try {
            // Parse JWT to check expiration
            const parts = token.split(".")
            if (parts.length !== 3) {
                return null
            }

            const payload = JSON.parse(atob(parts[1]))
            const currentTime = Math.floor(Date.now() / 1000)

            // Check if token expires within the next 5 minutes
            if (payload.exp && payload.exp < currentTime + 300) {
                console.log("[Auth] Token is expired or expiring soon")
                return null
            }

            return token
        } catch (error) {
            console.error("[Auth] Error validating token:", error)
            return null
        }
    }

    /**
     * Attempt to refresh the token
     */
    const refreshToken = async (): Promise<string | null> => {
        try {
            // If your backend supports token refresh, implement it here
            // For now, we'll just check if the current token is still valid
            const currentToken = getValidToken()
            if (currentToken) {
                return currentToken
            }

            // If no valid token, user needs to log in again
            console.log("[Auth] No valid token available, user needs to re-authenticate")
            // Only logout if not already on login page
            if (location.pathname !== '/login') {
                logout()
            }
            return null
        } catch (error) {
            console.error("[Auth] Error refreshing token:", error)
            if (location.pathname !== '/login') {
                logout()
            }
            return null
        }
    }

    const login = async (credentials: LoginCredentials): Promise<void> => {
        try {
            setLoading(true)
            const response = await authService.login(credentials)
            setUser(response.user)
            toast.success("Logged in successfully")

            // Redirect based on user role
            if (response.user.role === "ADMIN") {
                navigate("/admin")
            } else {
                navigate("/problems")
            }
        } catch (error) {
            toast.error("Login failed. Please check your credentials.")
            throw error
        } finally {
            setLoading(false)
        }
    }

    const logout = (): void => {
        authService.logout()
        setUser(null)
        toast.info("Logged out successfully")
        navigate("/login")
    }

    const value = {
        user,
        isLoggedIn: !!user,
        loading,
        login,
        logout,
        getValidToken,
        refreshToken,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}