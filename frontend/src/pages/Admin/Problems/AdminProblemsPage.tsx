"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Search, ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Trash2, Edit } from "lucide-react"
import { toast } from "react-toastify"
import adminService, { type AdminProblemDto } from "../../../service/adminService"
import { Button } from "../../../components/ui/Button"
import { Modal } from "../../../components/ui/Modal.tsx"

export function AdminProblemsPage() {
    const [problems, setProblems] = useState<AdminProblemDto[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [size] = useState(10)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [sort, setSort] = useState("createdAt,desc")
    const [searchTerm, setSearchTerm] = useState("")
    const [visibilityUpdateLoading, setVisibilityUpdateLoading] = useState<string | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [problemToDelete, setProblemToDelete] = useState<AdminProblemDto | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchProblems = async () => {
        setLoading(true)
        try {
            const response = await adminService.getProblems(page, size, sort, searchTerm)
            setProblems(response.content)
            setTotalPages(response.totalPages)
            setTotalElements(response.totalElements)
        } catch (error) {
            console.error("Failed to fetch problems:", error)
            toast.error("Failed to load problems")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProblems()
    }, [page, size, sort])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(0) // Reset to first page when searching
        fetchProblems()
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

    const handleVisibilityToggle = async (problem: AdminProblemDto) => {
        setVisibilityUpdateLoading(problem.id)
        try {
            await adminService.updateProblemVisibility(problem.slug, !problem.hidden)
            // Update the problem in the local state
            setProblems(problems.map((p) => (p.id === problem.id ? { ...p, hidden: !problem.hidden } : p)))
            toast.success(`Problem is now ${problem.hidden ? "visible" : "hidden"}`)
        } catch (error) {
            console.error("Failed to update problem visibility:", error)
            toast.error("Failed to update problem visibility")
        } finally {
            setVisibilityUpdateLoading(null)
        }
    }

    const openDeleteModal = (problem: AdminProblemDto) => {
        setProblemToDelete(problem)
        setDeleteModalOpen(true)
    }

    const handleDeleteProblem = async () => {
        if (!problemToDelete) return

        setDeleteLoading(true)
        try {
            await adminService.deleteProblem(problemToDelete.slug)
            // Remove the problem from the local state
            setProblems(problems.filter((p) => p.id !== problemToDelete.id))
            toast.success("Problem deleted successfully")
            setDeleteModalOpen(false)
            setProblemToDelete(null)
        } catch (error) {
            console.error("Failed to delete problem:", error)
            toast.error("Failed to delete problem")
        } finally {
            setDeleteLoading(false)
        }
    }

    const getDifficultyBadge = (difficulty: string) => {
        switch (difficulty) {
            case "EASY":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Easy
          </span>
                )
            case "MEDIUM":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            Medium
          </span>
                )
            case "HARD":
                return (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            Hard
          </span>
                )
            default:
                return null
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Problem Management</h1>
                <div className="flex items-center gap-4">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button type="submit" className="sr-only">
                            Search
                        </button>
                    </form>
                    <Link to="/admin/problems/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add Problem
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("title")}
                            >
                                <div className="flex items-center">Title {getSortIcon("title")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("slug")}
                            >
                                <div className="flex items-center">Slug {getSortIcon("slug")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("difficulty")}
                            >
                                <div className="flex items-center">Difficulty {getSortIcon("difficulty")}</div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                                onClick={() => handleSort("hidden")}
                            >
                                <div className="flex items-center">Status {getSortIcon("hidden")}</div>
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
                                    Loading problems...
                                </td>
                            </tr>
                        ) : problems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    No problems found
                                </td>
                            </tr>
                        ) : (
                            problems.map((problem) => (
                                <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{problem.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {problem.slug}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getDifficultyBadge(problem.difficulty)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              problem.hidden
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                      >
                        {problem.hidden ? "Hidden" : "Visible"}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(problem.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <Link to={`/admin/problems/${problem.slug}`}>
                                                <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400" title="Edit">
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleVisibilityToggle(problem)}
                                                disabled={visibilityUpdateLoading === problem.id}
                                                className={
                                                    problem.hidden ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                                                }
                                                title={problem.hidden ? "Make visible" : "Hide"}
                                            >
                                                {problem.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                <span className="sr-only">{problem.hidden ? "Make visible" : "Hide"}</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openDeleteModal(problem)}
                                                className="text-red-600 dark:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete</span>
                                            </Button>
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
                                Showing <span className="font-medium">{problems.length > 0 ? page * size + 1 : 0}</span> to{" "}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setProblemToDelete(null)
                }}
                title="Delete Problem"
            >
                <div className="p-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Are you sure you want to delete the problem "{problemToDelete?.title}"? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setDeleteModalOpen(false)
                                setProblemToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProblem} disabled={deleteLoading}>
                            {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
