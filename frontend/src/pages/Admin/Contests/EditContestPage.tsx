import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { apiClient } from "../../../api/client"
import { toast } from "react-toastify"
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "../../../components/ui/Button"
import adminService from "../../../service/adminService"

interface UpdateContestRequest {
    title: string
    description: string
    startTime: string
    endTime: string
    isHidden: boolean
    leaderboard: boolean
}

interface ProblemOption {
    id: string
    title: string
    slug: string
    difficulty: string
}

interface ContestProblem {
    id: string
    problemId: string
    title: string
    index: number
}

export function EditContestPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [formData, setFormData] = useState<UpdateContestRequest>({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        isHidden: true,
        leaderboard: true,
    })
    const [contestProblems, setContestProblems] = useState<ContestProblem[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [availableProblems, setAvailableProblems] = useState<ProblemOption[]>([])
    const [loadingProblems, setLoadingProblems] = useState(true)
    const [loadingContest, setLoadingContest] = useState(true)
    const [selectedProblemId, setSelectedProblemId] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return

            try {
                // Fetch contest details
                const contest = await adminService.getContest(id)

                // Convert dates to local datetime format for input fields
                const startTime = new Date(contest.startTime).toISOString().slice(0, 16)
                const endTime = new Date(contest.endTime).toISOString().slice(0, 16)

                setFormData({
                    title: contest.title,
                    description: contest.description || "",
                    startTime,
                    endTime,
                    isHidden: contest.hidden,
                    leaderboard: contest.leaderboard,
                })

                setContestProblems(contest.problems.map(p => ({
                    id: p.id,
                    problemId: p.problemId,
                    title: p.title,
                    index: p.index
                })))

                // Fetch available problems
                setLoadingProblems(true)
                const response = await apiClient.get("/admin/problems?size=100")
                setAvailableProblems(
                    response.data.content.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        difficulty: p.difficulty,
                    }))
                )
            } catch (error) {
                console.error("Failed to fetch data:", error)
                toast.error("Failed to load contest details")
                navigate("/admin/contests")
            } finally {
                setLoadingContest(false)
                setLoadingProblems(false)
            }
        }

        fetchData()
    }, [id, navigate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        setFormData({ ...formData, [name]: newValue })

        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" })
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.title.trim()) {
            newErrors.title = "Title is required"
        }

        if (!formData.startTime) {
            newErrors.startTime = "Start time is required"
        }

        if (!formData.endTime) {
            newErrors.endTime = "End time is required"
        } else if (new Date(formData.startTime) >= new Date(formData.endTime)) {
            newErrors.endTime = "End time must be after start time"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm() || !id) {
            return
        }

        setIsSubmitting(true)

        try {
            await adminService.updateContest(id, formData)
            toast.success("Contest updated successfully")
            navigate("/admin/contests")
        } catch (error: any) {
            console.error("Failed to update contest:", error)
            toast.error(error.response?.data?.errorMessage || "Failed to update contest")
        } finally {
            setIsSubmitting(false)
        }
    }

    const addProblem = async () => {
        if (!selectedProblemId || !id) {
            toast.error("Please select a problem to add")
            return
        }

        // Check if problem is already added
        if (contestProblems.some((p) => p.problemId === selectedProblemId)) {
            toast.error("This problem is already added to the contest")
            return
        }

        try {
            const newIndex = contestProblems.length
            await adminService.addProblemToContest(id, selectedProblemId, newIndex)

            // Refresh contest data
            const contest = await adminService.getContest(id)
            setContestProblems(contest.problems.map(p => ({
                id: p.id,
                problemId: p.problemId,
                title: p.title,
                index: p.index
            })))

            setSelectedProblemId("")
            toast.success("Problem added successfully")
        } catch (error) {
            console.error("Failed to add problem:", error)
            toast.error("Failed to add problem to contest")
        }
    }

    const removeProblem = async (problemId: string) => {
        if (!id) return

        try {
            await adminService.removeProblemFromContest(id, problemId)

            // Refresh contest data
            const contest = await adminService.getContest(id)
            setContestProblems(contest.problems.map(p => ({
                id: p.id,
                problemId: p.problemId,
                title: p.title,
                index: p.index
            })))

            toast.success("Problem removed successfully")
        } catch (error) {
            console.error("Failed to remove problem:", error)
            toast.error("Failed to remove problem from contest")
        }
    }

    const moveProblem = async (index: number, direction: "up" | "down") => {
        if (!id) return

        const problems = [...contestProblems]
        const targetIndex = direction === "up" ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= problems.length) return

        // Swap the problems
        [problems[index], problems[targetIndex]] = [problems[targetIndex], problems[index]]

        // Update indices
        try {
            // Remove all problems first
            for (const problem of contestProblems) {
                await adminService.removeProblemFromContest(id, problem.problemId)
            }

            // Re-add them in new order
            for (let i = 0; i < problems.length; i++) {
                await adminService.addProblemToContest(id, problems[i].problemId, i)
            }

            // Refresh contest data
            const contest = await adminService.getContest(id)
            setContestProblems(contest.problems.map(p => ({
                id: p.id,
                problemId: p.problemId,
                title: p.title,
                index: p.index
            })))

            toast.success("Problem order updated")
        } catch (error) {
            console.error("Failed to update problem order:", error)
            toast.error("Failed to update problem order")
        }
    }

    if (loadingContest) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/admin/contests")}
                    className="text-gray-600 dark:text-gray-400"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Contests
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Contest</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                errors.title ? "border-red-500 dark:border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Enter contest title"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter contest description"
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="startTime"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.startTime ? "border-red-500 dark:border-red-500" : "border-gray-300"
                                }`}
                            />
                            {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
                        </div>

                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                id="endTime"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.endTime ? "border-red-500 dark:border-red-500" : "border-gray-300"
                                }`}
                            />
                            {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isHidden"
                                name="isHidden"
                                checked={formData.isHidden}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                            />
                            <label htmlFor="isHidden" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Hidden (not visible to users until ready)
                            </label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="leaderboard"
                                name="leaderboard"
                                checked={formData.leaderboard}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                            />
                            <label htmlFor="leaderboard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Enable Leaderboard
                            </label>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contest Problems</h2>

                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            <div className="flex-1">
                                <label
                                    htmlFor="selectedProblemId"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Add Problem
                                </label>
                                <select
                                    id="selectedProblemId"
                                    value={selectedProblemId}
                                    onChange={(e) => setSelectedProblemId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    disabled={loadingProblems}
                                >
                                    <option value="">Select a problem</option>
                                    {availableProblems.map((problem) => (
                                        <option key={problem.id} value={problem.id}>
                                            {problem.title} ({problem.difficulty})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button type="button" onClick={addProblem} disabled={!selectedProblemId || loadingProblems}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Problem
                                </Button>
                            </div>
                        </div>

                        {contestProblems.length === 0 ? (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
                                <p className="text-gray-500 dark:text-gray-400">No problems added yet.</p>
                            </div>
                        ) : (
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-100 dark:bg-gray-600">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        >
                                            Index
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        >
                                            Problem
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                                    {contestProblems
                                        .sort((a, b) => a.index - b.index)
                                        .map((problem, index) => (
                                            <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {String.fromCharCode(65 + index)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                    {problem.title}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => moveProblem(index, "up")}
                                                            disabled={index === 0}
                                                            className="text-gray-600 dark:text-gray-400"
                                                            type="button"
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                            <span className="sr-only">Move Up</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => moveProblem(index, "down")}
                                                            disabled={index === contestProblems.length - 1}
                                                            className="text-gray-600 dark:text-gray-400"
                                                            type="button"
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                            <span className="sr-only">Move Down</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeProblem(problem.problemId)}
                                                            className="text-red-600 dark:text-red-400"
                                                            type="button"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Remove</span>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => navigate("/admin/contests")} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}