"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight, Shield, Ban, CheckCircle } from "lucide-react"
import { toast } from "react-toastify"
import adminService, { type AdminUserDto } from "../../../service/adminService"
import { Button } from "../../../components/ui/Button"

export function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUserDto[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [size] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [sort, setSort] = useState("username,asc")
    const [searchTerm, setSearchTerm] = useState("")
    const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null)
    const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await adminService.getUsers(page, size, sort, searchTerm)
            console.log(response.content)
            setUsers(response.content)
            setTotalPages(response.totalPages)
            setTotalElements(response.totalElements)
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [page, size, sort])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(0) // Reset to first page when searching
        fetchUsers()
    }

    const handleSort = (column: string) => {
        const [currentColumn, currentDirection] = sort.split(",")
        const direction = currentColumn === column && currentDirection === "asc" ? "desc" : "asc"
        setSort(`${column},${direction}`)
        setPage(0) // Reset to first page when sorting
    }

    const getSortIcon = (column: string) => {
        const [currentColumn, currentDirection] = sort.split(",")
        if (currentColumn !== column) return null
        return currentDirection === "asc" ? "↑" : "↓"
    }

    const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
        setRoleUpdateLoading(userId)
        try {
            await adminService.updateUserRole(userId, newRole)
            // Update the user in the local state
            setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
            toast.success(`User role updated to ${newRole}`)
        } catch (error) {
            console.error("Failed to update user role:", error)
            toast.error("Failed to update user role")
        } finally {
            setRoleUpdateLoading(null)
        }
    }

    const handleStatusChange = async (userId: string, newStatus: "ACTIVE" | "SUSPENDED" | "BANNED") => {
        setStatusUpdateLoading(userId)
        try {
            await adminService.updateUserStatus(userId, newStatus)
            // Update the user in the local state
            setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))
            toast.success(`User status updated to ${newStatus}`)
        } catch (error) {
            console.error("Failed to update user status:", error)
            toast.error("Failed to update user status")
        } finally {
            setStatusUpdateLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Active
          </span>
                )
            case "SUSPENDED":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Suspended
          </span>
                )
            case "BANNED":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Banned
          </span>
                )
            default:
                return null
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button type="submit" className="sr-only">
                        Search
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("username")}
                            >
                                <div className="flex items-center">Username {getSortIcon("username")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("email")}
                            >
                                <div className="flex items-center">Email {getSortIcon("email")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("role")}
                            >
                                <div className="flex items-center">Role {getSortIcon("role")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center">Status {getSortIcon("status")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("createdAt")}
                            >
                                <div className="flex items-center">Created At {getSortIcon("createdAt")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                            >
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    Loading users...
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {user.profilePicture ? (
                                                <img
                                                    className="h-8 w-8 rounded-full mr-3"
                                                    src={user.profilePicture || "/placeholder.svg"}
                                                    alt={`${user.username}'s profile`}
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 flex items-center justify-center">
                            <span className="text-gray-500 dark:text-gray-400">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                                                </div>
                                            )}
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          }`}
                      >
                        {user.role}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")}
                                                disabled={roleUpdateLoading === user.id}
                                                className="text-purple-600 dark:text-purple-400"
                                                title={user.role === "ADMIN" ? "Remove admin role" : "Make admin"}
                                            >
                                                <Shield className="h-4 w-4" />
                                                <span className="sr-only">{user.role === "ADMIN" ? "Remove admin role" : "Make admin"}</span>
                                            </Button>
                                            {user.status !== "BANNED" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(user.id, "BANNED")}
                                                    disabled={statusUpdateLoading === user.id}
                                                    className="text-red-600 dark:text-red-400"
                                                    title="Ban user"
                                                >
                                                    <Ban className="h-4 w-4" />
                                                    <span className="sr-only">Ban user</span>
                                                </Button>
                                            )}
                                            {user.status !== "ACTIVE" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(user.id, "ACTIVE")}
                                                    disabled={statusUpdateLoading === user.id}
                                                    className="text-green-600 dark:text-green-400"
                                                    title="Activate user"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    <span className="sr-only">Activate user</span>
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{users.length > 0 ? page * size + 1 : 0}</span> to{" "}
                                <span className="font-medium">{Math.min((page + 1) * size, totalElements)}</span> of{" "}
                                <span className="font-medium">{totalElements}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-l-md"
                                    onClick={() => setPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </Button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNumber = i + Math.max(0, Math.min(page - 2, totalPages - 5))
                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={pageNumber === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPage(pageNumber)}
                                            className={pageNumber === page ? "z-10" : ""}
                                        >
                                            {pageNumber + 1}
                                        </Button>
                                    )
                                })}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-r-md"
                                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    <span className="sr-only">Next</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
