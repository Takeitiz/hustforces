"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Users, FileCode, Trophy, BookOpen, PlusCircle, TrendingUp, Clock } from "lucide-react"
import adminService from "../../service/adminService"
import { toast } from "react-toastify"

interface DashboardStats {
    userCount: number
    problemCount: number
    contestCount: number
    solutionCount: number
    recentUsers: {
        id: string
        username: string
        email: string
        role: string
        createdAt: string
    }[]
    recentProblems: {
        id: string
        title: string
        difficulty: string
        createdAt: string
    }[]
}

const AdminHomePage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const data = await adminService.getDashboardStats()
                setStats(data)
            } catch (error) {
                console.error("Error fetching dashboard stats:", error)
                toast.error("Failed to load dashboard statistics")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            case "HARD":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link
                        to="/admin/users"
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Users</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.userCount || 0}</p>
                    </Link>

                    <Link
                        to="/admin/problems"
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
                            <FileCode size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Problems</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.problemCount || 0}</p>
                    </Link>

                    <Link
                        to="/admin/contests"
                        className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4">
                            <Trophy size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Contests</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.contestCount || 0}</p>
                    </Link>

                    <div className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                        <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-4">
                            <BookOpen size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Solutions</h3>
                        <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{stats?.solutionCount || 0}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Users</h2>
                        <Link
                            to="/admin/users"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                        >
                            <span>View All</span>
                            <TrendingUp size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-pulse flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {stats.recentUsers.map((user) => (
                                <div key={user.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.username}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${
                            user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                    >
                      {user.role}
                    </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                                            {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No recent users found</div>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Problems</h2>
                        <Link
                            to="/admin/problems"
                            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-sm"
                        >
                            <span>View All</span>
                            <TrendingUp size={16} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : stats?.recentProblems && stats.recentProblems.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {stats.recentProblems.map((problem) => (
                                <div key={problem.id} className="py-3">
                                    <p className="font-medium text-gray-900 dark:text-white mb-1">{problem.title}</p>
                                    <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                                            {new Date(problem.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No recent problems found</div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/admin/problems/create"
                        className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <PlusCircle size={24} />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Create Problem</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Add a new problem to the platform</p>
                    </Link>

                    <Link
                        to="/admin/contests/create"
                        className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Trophy size={24} />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Create Contest</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Schedule a new programming contest</p>
                    </Link>

                    <Link
                        to="/admin/import"
                        className="flex flex-col items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <FileCode size={24} />
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Import problems or seed languages</p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default AdminHomePage
