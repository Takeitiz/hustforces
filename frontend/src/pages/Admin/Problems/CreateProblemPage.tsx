"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { Button } from "../../../components/ui/Button"
import adminService from "../../../service/adminService"
import { ArrowLeft, Save } from "lucide-react"

export function CreateProblemPage() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        difficulty: "MEDIUM",
        hidden: true,
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value

        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }))

        // Auto-generate slug from title if slug is empty
        if (name === "title" && !formData.slug) {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
            setFormData((prev) => ({
                ...prev,
                slug: generatedSlug,
            }))
        }

        // Clear error for this field
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.title.trim()) {
            newErrors.title = "Title is required"
        }

        if (!formData.slug.trim()) {
            newErrors.slug = "Slug is required"
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens"
        }

        if (!formData.difficulty) {
            newErrors.difficulty = "Difficulty is required"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error("Please fix the errors in the form")
            return
        }

        setLoading(true)
        try {
            const response = // When calling createProblem
                await adminService.createProblem({
                    ...formData,
                    difficulty: formData.difficulty as "EASY" | "MEDIUM" | "HARD"
                });
            toast.success("Problem created successfully")
            navigate(`/admin/problems/${response.slug}`)
        } catch (error) {
            console.error("Failed to create problem:", error)
            toast.error("Failed to create problem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Problem</h1>
                <Button variant="outline" onClick={() => navigate("/admin/problems")} className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Problems
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6">
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
                                    errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="Enter problem title"
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.slug ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                }`}
                                placeholder="enter-problem-slug"
                            />
                            {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Used in the URL. Only lowercase letters, numbers, and hyphens.
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    errors.difficulty ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                                }`}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                            {errors.difficulty && <p className="mt-1 text-sm text-red-500">{errors.difficulty}</p>}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="hidden"
                                name="hidden"
                                checked={formData.hidden}
                                onChange={(e) => setFormData((prev) => ({ ...prev, hidden: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="hidden" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Hide problem (only visible to admins until published)
                            </label>
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? "Creating..." : "Create Problem"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">What's Next?</h2>
                <p className="text-blue-700 dark:text-blue-400 mb-2">After creating the problem, you'll be able to:</p>
                <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                    <li>Add a detailed problem description</li>
                    <li>Define test cases</li>
                    <li>Set up boilerplate code for different languages</li>
                    <li>Configure time and memory limits</li>
                </ul>
            </div>
        </div>
    )
}
