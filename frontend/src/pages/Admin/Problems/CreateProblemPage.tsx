"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Save } from "lucide-react"
import adminService, { type ProblemCreateDto } from "../../../service/adminService"
import { toast } from "react-hot-toast"

export const CreateProblemPage: React.FC = () => {
    const navigate = useNavigate()
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<ProblemCreateDto>({
        title: "",
        slug: "",
        difficulty: "MEDIUM",
        hidden: true,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        if (name === "difficulty") {
            setFormData({
                ...formData,
                difficulty: value as "EASY" | "MEDIUM" | "HARD",
            })
        } else {
            setFormData({
                ...formData,
                [name]: value,
            })
        }
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData({
            ...formData,
            [name]: checked,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error("Title is required")
            return
        }

        if (!formData.slug.trim()) {
            toast.error("Slug is required")
            return
        }

        setSaving(true)

        try {
            const response = await adminService.createProblem(formData)
            toast.success("Problem created successfully")
            navigate(`/admin/problems/${response.slug}/edit`)
        } catch (error) {
            console.error("Failed to create problem:", error)
            toast.error("Failed to create problem")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div>
            <div className="flex items-center mb-6">
                <Link
                    to="/admin/problems"
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Problems</span>
                </Link>
                <h1 className="text-2xl font-bold">Create New Problem</h1>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">Getting Started</h2>
                <p className="text-blue-700 dark:text-blue-400 mb-2">Creating a problem is a two-step process:</p>
                <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1 ml-2">
                    <li>First, provide the basic information (title, slug, difficulty)</li>
                    <li>
                        Then, you'll be redirected to the edit page to add the problem description, test cases, and other details
                    </li>
                </ol>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                                placeholder="e.g., Two Sum"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Choose a clear, descriptive title that indicates what the problem is about
                            </p>
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Slug <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                                placeholder="e.g., two-sum"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The slug is used in the URL and should be unique, lowercase, and use hyphens instead of spaces
                            </p>
                        </div>

                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Difficulty <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="difficulty"
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Select the appropriate difficulty level for this problem</p>
                        </div>

                        <div>
                            <div className="flex items-center mb-1">
                                <input
                                    type="checkbox"
                                    id="hidden"
                                    name="hidden"
                                    checked={formData.hidden}
                                    onChange={handleCheckboxChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="hidden" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Hidden (not visible to users)
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">
                                Keep the problem hidden until you've completed all details in the next step
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Ready to create this problem?</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                After creating the problem, you'll be redirected to the edit page to add the description and test cases.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 min-w-[180px]"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Create & Continue</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
