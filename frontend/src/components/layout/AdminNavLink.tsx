"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { LayoutDashboard } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

interface AdminNavLinkProps {
    className?: string
}

const AdminNavLink: React.FC<AdminNavLinkProps> = ({ className = "" }) => {
    const { user } = useAuth()

    // Only show for admin users
    if (!user || user.role !== "ADMIN") {
        return null
    }

    return (
        <Link
            to="/admin"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors ${className}`}
            title="Admin Dashboard"
        >
            <LayoutDashboard size={16} />
            <span>Admin</span>
        </Link>
    )
}

export default AdminNavLink
