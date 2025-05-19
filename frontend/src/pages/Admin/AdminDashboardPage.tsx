"use client"

import type React from "react"
import { Outlet, Navigate } from "react-router-dom"
import AdminSidebar from "../../components/features/admin/AdminSidebar"
import { useAuth } from "../../contexts/AuthContext"
import { Loader2 } from "lucide-react"

const AdminDashboardPage: React.FC = () => {
    const { user, isLoggedIn, loading } = useAuth()

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
                </div>
            </div>
        )
    }

    // Redirect if not logged in
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />
    }

    // Redirect if not an admin
    if (user?.role !== "ADMIN") {
        return <Navigate to="/unauthorized" replace />
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar />
            <div className="flex-1 p-8 overflow-auto">
                <Outlet />
            </div>
        </div>
    )
}

export default AdminDashboardPage
