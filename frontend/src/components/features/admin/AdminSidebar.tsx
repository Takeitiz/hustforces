"use client"

import type React from "react"
import { NavLink, Link } from "react-router-dom"
import { useAuth } from "../../../contexts/AuthContext"
import { Logo } from "../../ui/Logo"
import {
    LayoutDashboard,
    Users,
    FileCode,
    Trophy,
    Upload,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings,
} from "lucide-react"
import { useState } from "react"

const AdminSidebar: React.FC = () => {
    const { logout, user } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const navItems = [
        { path: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} />, exact: true },
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
            className={`relative bg-white dark:bg-gray-800 shadow-md min-h-screen transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                {!collapsed && (
                    <div>
                        <Logo size="small" />
                        <div className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Admin Dashboard</div>
                    </div>
                )}
                {collapsed && (
                    <div className="mx-auto">
                        <Logo size="small" />
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
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

            <nav className="mt-6">
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

            <div className="absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
                <Link
                    to="/"
                    className={`flex items-center ${collapsed ? "justify-center" : ""} mb-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200`}
                >
                    {collapsed ? <span className="text-xs">Home</span> : <span>Return to Site</span>}
                </Link>
                <button
                    onClick={logout}
                    className={`flex items-center ${
                        collapsed ? "justify-center w-full" : ""
                    } px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-gray-300 dark:hover:bg-gray-700`}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="ml-2">Logout</span>}
                </button>
            </div>
        </div>
    )
}

export default AdminSidebar
