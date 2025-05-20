"use client"

import type React from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"
import { Logo } from "../../ui/Logo"
import {
    LayoutDashboard,
    Users,
    FileCode,
    Trophy,
    Upload,
    ChevronLeft,
    ChevronRight,
    Settings,
    Command,
} from "lucide-react"
import { useState } from "react"

// Define the type for navigation items
interface NavItem {
    path: string
    label: string
    icon: React.ReactNode
    exact?: boolean
}

const AdminSidebar: React.FC = () => {
    const { user } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const navItems: NavItem[] = [
        { path: "/admin/users", label: "Users", icon: <Users size={20} /> },
        { path: "/admin/problems", label: "Problems", icon: <FileCode size={20} /> },
        { path: "/admin/contests", label: "Contests", icon: <Trophy size={20} /> },
        { path: "/admin/import", label: "Import", icon: <Upload size={20} /> },
        { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
    ]

    const toggleSidebar = () => {
        setCollapsed(!collapsed)
    }

    return (
        <div
            className={`relative bg-white dark:bg-gray-800 shadow-md min-h-screen transition-all duration-300 ease-in-out ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                {!collapsed ? (
                    <div>
                        <Logo size="small" />
                        <div className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Admin Dashboard</div>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        <Command size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 ${
                        collapsed ? "absolute right-2 top-4" : ""
                    }`}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    {user?.profilePicture ? (
                        <img
                            src={user.profilePicture || "/placeholder.svg"}
                            alt="Profile"
                            className={`rounded-full ${collapsed ? "w-10 h-10 mx-auto" : "w-10 h-10 mr-3"}`}
                        />
                    ) : (
                        <div
                            className={`rounded-full bg-blue-100 text-blue-600 flex items-center justify-center ${
                                collapsed ? "w-10 h-10 mx-auto" : "w-10 h-10 mr-3"
                            }`}
                        >
                            <span className="font-medium text-lg">{user?.username?.charAt(0).toUpperCase() || "A"}</span>
                        </div>
                    )}
                    {!collapsed && (
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user?.username}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Administrator</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Persistent Dashboard Navigation */}
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 mt-2 shadow-sm">
                <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                        `flex items-center px-4 py-3 rounded-md transition-colors ${
                            isActive
                                ? "bg-blue-600 text-white font-medium dark:bg-blue-700"
                                : "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        } ${collapsed ? "justify-center" : ""}`
                    }
                >
                    <LayoutDashboard size={collapsed ? 24 : 20} className={collapsed ? "" : "mr-2"} />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
            </div>

            <nav className="mt-4 pb-6">
                <ul>
                    {navItems.map((item) => (
                        <li key={item.path} className="px-2 py-1">
                            <NavLink
                                to={item.path}
                                end={item.exact}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2 rounded-md transition-colors ${
                                        isActive
                                            ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    }`
                                }
                            >
                                <span className="flex-shrink-0">{item.icon}</span>
                                {!collapsed && <span className="ml-3">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}

export default AdminSidebar
