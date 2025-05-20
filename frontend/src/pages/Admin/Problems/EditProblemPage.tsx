"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import adminService, { type TestCase, type ProblemUpdateDto } from "../../../service/adminService"
import { toast } from "react-hot-toast"

interface FormData {
    title: string
    slug: string
    description: string
    structure: string
    difficulty: "EASY" | "MEDIUM" | "HARD"
    timeLimit: number
    memoryLimit: number
    tags: string[]
    testcases: TestCase[]
    hidden: boolean
}

// Define the default structure template
const DEFAULT_STRUCTURE_TEMPLATE = `Problem Name: "Two Sum"
Function Name: sum
Input Structure:
Input Field: int num1
Input Field: int num2
Output Structure:
Output Field: int result`

export const EditProblemPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<FormData>({
        title: "",
        slug: "",
        description: "",
        structure: DEFAULT_STRUCTURE_TEMPLATE,
        difficulty: "MEDIUM",
        timeLimit: 1,
        memoryLimit: 256,
        tags: [],
        testcases: [],
        hidden: false,
    })
    const [newTag, setNewTag] = useState("")
    const [newTestCase, setNewTestCase] = useState<{
        input: string
        output: string
    }>({
        input: "",
        output: "",
    })

    useEffect(() => {
        const fetchProblem = async () => {
            if (!slug) {
                setError("Problem slug is missing")
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)

            try {
                const problem = await adminService.getProblem(slug)
                setFormData({
                    title: problem.title,
                    slug: problem.slug,
                    description: problem.description,
                    structure: problem.structure || DEFAULT_STRUCTURE_TEMPLATE,
                    difficulty: problem.difficulty,
                    timeLimit: problem.timeLimit,
                    memoryLimit: problem.memoryLimit,
                    tags: problem.tags,
                    testcases: problem.testcases,
                    hidden: problem.hidden ?? false,
                })
            } catch (error) {
                console.error("Failed to fetch problem:", error)
                setError("Failed to load problem details. Please try again later.")
                toast.error("Failed to load problem details")
            } finally {
                setLoading(false)
            }
        }

        fetchProblem()
    }, [slug])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target

        if (type === "number") {
            setFormData({
                ...formData,
                [name]: Number.parseFloat(value),
            })
        } else if (name === "difficulty") {
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

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, newTag.trim()],
            })
            setNewTag("")
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((tag) => tag !== tagToRemove),
        })
    }

    const handleTestCaseChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: keyof typeof newTestCase) => {
        setNewTestCase({
            ...newTestCase,
            [field]: e.target.value,
        })
    }

    const handleAddTestCase = () => {
        if (newTestCase.input.trim() && newTestCase.output.trim()) {
            const testCase: TestCase = {
                id: `tc-${Date.now()}`, // Generate a temporary ID
                input: newTestCase.input.trim(),
                output: newTestCase.output.trim(),
            }

            setFormData({
                ...formData,
                testcases: [...formData.testcases, testCase],
            })

            setNewTestCase({
                input: "",
                output: "",
            })
        }
    }

    const handleRemoveTestCase = (id: string) => {
        setFormData({
            ...formData,
            testcases: formData.testcases.filter((tc) => tc.id !== id),
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

        if (!formData.description.trim()) {
            toast.error("Description is required")
            return
        }

        if (!formData.structure.trim()) {
            toast.error("Structure is required")
            return
        }

        if (formData.testcases.length === 0) {
            toast.error("At least one test case is required")
            return
        }

        setSaving(true)

        try {
            // Prepare the update data
            const updateData: ProblemUpdateDto = {
                title: formData.title,
                description: formData.description,
                structure: formData.structure,
                difficulty: formData.difficulty,
                testcases: formData.testcases,
                hidden: formData.hidden,
            }

            // Call the API to update the problem
            if (!slug) {
                throw new Error("Problem slug is missing")
            }

            const updatedProblem = await adminService.updateProblem(slug, updateData)

            toast.success("Problem updated successfully")

            // Navigate to the problem detail page with the potentially new slug
            navigate(`/admin/problems/${updatedProblem.slug}`)
        } catch (error) {
            console.error("Failed to update problem:", error)

            // Show more specific error message if available
            if (error instanceof Error) {
                toast.error(`Failed to update problem: ${error.message}`)
            } else {
                toast.error("Failed to update problem. Please try again later.")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{error}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">There was an error loading the problem details.</p>
                <Link
                    to="/admin/problems"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    Back to Problems
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        to={`/admin/problems/${slug}`}
                        className="flex items-center gap-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Problem</span>
                    </Link>
                    <h1 className="text-2xl font-bold">Edit Problem</h1>
                </div>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                    <Save size={18} />
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Slug
                            </label>
                            <input
                                type="text"
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The slug is used in the URL and should be unique, e.g., "two-sum"
                            </p>
                        </div>

                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Difficulty
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
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Time Limit (seconds)
                                </label>
                                <input
                                    type="number"
                                    id="timeLimit"
                                    name="timeLimit"
                                    value={formData.timeLimit}
                                    onChange={handleChange}
                                    min="0.1"
                                    step="0.1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="flex-1">
                                <label
                                    htmlFor="memoryLimit"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Memory Limit (MB)
                                </label>
                                <input
                                    type="number"
                                    id="memoryLimit"
                                    name="memoryLimit"
                                    value={formData.memoryLimit}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center mb-2">
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
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Problem Description</h2>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (Markdown supported)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={15}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                            required
                        ></textarea>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Problem Structure</h2>
                    <div>
                        <label htmlFor="structure" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Structure (Markdown supported)
                        </label>
                        <textarea
                            id="structure"
                            name="structure"
                            value={formData.structure}
                            onChange={handleChange}
                            rows={10}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">
                            Define the problem structure, including input/output formats, constraints, and examples.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Tags</h2>
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {formData.tags.length === 0 ? (
                                <span className="text-gray-500 dark:text-gray-400">No tags added yet</span>
                            ) : (
                                formData.tags.map((tag) => (
                                    <div
                                        key={tag}
                                        className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                                    >
                                        <span>{tag}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a tag"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={handleAddTag}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
                    <div className="space-y-6">
                        {formData.testcases.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No test cases added yet</p>
                        ) : (
                            formData.testcases.map((testCase, index) => (
                                <div key={testCase.id} className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-medium">Test Case #{index + 1}</h3>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTestCase(testCase.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Input:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.input}
                      </pre>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Output:</div>
                                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm">
                        {testCase.output}
                      </pre>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        <div className="border-t pt-6">
                            <h3 className="font-medium mb-4">Add New Test Case</h3>
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="newTestCaseInput"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >
                                        Input
                                    </label>
                                    <textarea
                                        id="newTestCaseInput"
                                        value={newTestCase.input}
                                        onChange={(e) => handleTestCaseChange(e, "input")}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                    ></textarea>
                                </div>

                                <div>
                                    <label
                                        htmlFor="newTestCaseOutput"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                    >
                                        Expected Output
                                    </label>
                                    <textarea
                                        id="newTestCaseOutput"
                                        value={newTestCase.output}
                                        onChange={(e) => handleTestCaseChange(e, "output")}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                    ></textarea>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={handleAddTestCase}
                                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        <Plus size={18} />
                                        <span>Add Test Case</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                    >
                        <Save size={18} />
                        <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
