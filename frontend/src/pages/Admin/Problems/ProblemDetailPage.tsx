"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import {
    ArrowLeft,
    Edit,
    Trash2,
    Clock,
    Database,
    ChevronLeft,
    ChevronRight,
    FileText,
    Code,
    List,
    AlertTriangle,
    Tag,
    BarChart,
} from "lucide-react"
import adminService, { type TestCase, type ProblemDetailDto } from "../../../service/adminService" // Assuming this path is correct
import { toast } from "react-hot-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"

// Define the type for the custom code component's props
interface CustomCodeRendererProps {
    node?: any; // or HastElement if @types/hast is installed
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any; // Allows other props to be passed (e.g., for SyntaxHighlighter)
}

// Define a generic type for other simple custom markdown components
interface SimpleMarkdownComponentProps {
    node?: any; // or HastElement
    [key: string]: any;
}


export const ProblemDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>()
    const [problem, setProblem] = useState<ProblemDetailDto | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const navigate = useNavigate()

    // State for test case pagination
    const [testCases, setTestCases] = useState<TestCase[]>([])
    const [testCasePage, setTestCasePage] = useState(0)
    const [testCaseSize] = useState(5) // Number of test cases per page
    const [totalTestCasePages, setTotalTestCasePages] = useState(0)
    const [totalTestCases, setTotalTestCases] = useState(0)
    const [testCasesLoading, setTestCasesLoading] = useState(false)

    // Function to fetch paginated test cases - memoized with useCallback
    const fetchTestCases = useCallback(
        async (page: number, currentSlug?: string) => {
            const slugToFetch = currentSlug || slug;
            if (!slugToFetch) return

            setTestCasesLoading(true)
            try {
                // Ensure adminService.getProblemTestCases is correctly defined and imported
                const response = await adminService.getProblemTestCases(slugToFetch, page, testCaseSize)
                setTestCases(response.testcases || []) // Ensure testcases is an array
                setTotalTestCasePages(response.totalPages || 0)
                setTotalTestCases(response.totalElements || 0)
                setTestCasePage(page)
            } catch (error) {
                console.error("Failed to fetch test cases:", error)
                toast.error("Failed to load test cases")
                // Set to empty/default states on error to prevent potential issues
                setTestCases([])
                setTotalTestCasePages(0)
                setTotalTestCases(0)
            } finally {
                setTestCasesLoading(false)
            }
        },
        [slug, testCaseSize], // slug dependency ensures it refetches if slug changes, testCaseSize is constant
    )

    // Fetch problem details
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
                // Ensure adminService.getProblem is correctly defined and imported
                const response = await adminService.getProblem(slug)
                setProblem(response)

                // Handle test cases included in the problem response or fetch separately
                if (response.testcases && response.testcases.length <= 20 && response.testcases.length > 0) {
                    setTestCases(response.testcases)
                    setTotalTestCases(response.testcases.length)
                    setTotalTestCasePages(Math.ceil(response.testcases.length / testCaseSize))
                    setTestCasePage(0); // Reset to first page
                } else if (response.id) { // Assuming problem ID exists if test cases need separate fetching
                    fetchTestCases(0, slug) // Fetch first page of test cases for the current slug
                } else {
                    // No test cases provided directly and not enough info to fetch them
                    setTestCases([])
                    setTotalTestCases(0)
                    setTotalTestCasePages(0)
                }
            } catch (error) {
                console.error("Failed to fetch problem:", error)
                setError("Failed to load problem details. Please try again later.")
                toast.error("Failed to load problem details")
                setProblem(null) // Clear problem data on error
            } finally {
                setLoading(false)
            }
        }

        fetchProblem()
    }, [slug, testCaseSize, fetchTestCases]) // Include fetchTestCases in dependency array

    // Handle page change for test cases
    const handleTestCasePageChange = (newPage: number) => {
        if (newPage >= 0 && newPage < totalTestCasePages && !testCasesLoading) {
            fetchTestCases(newPage)
        }
    }

    const handleDelete = async () => {
        if (!problem || !problem.slug) return // Ensure problem and slug exist

        setDeleteLoading(true)
        try {
            // Ensure adminService.deleteProblem is correctly defined and imported
            await adminService.deleteProblem(problem.slug)
            toast.success("Problem deleted successfully")
            navigate("/admin/problems") // Adjust navigation target as needed
        } catch (error) {
            console.error("Failed to delete problem:", error)
            toast.error("Failed to delete problem")
        } finally {
            setDeleteLoading(false)
            setDeleteModalOpen(false)
        }
    }

    const getDifficultyColor = (difficulty: string | undefined) => {
        switch (difficulty) {
            case "EASY":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            case "MEDIUM":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            case "HARD":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        }
    }

    // Parse problem structure if available
    const parseStructure = (structureText: string | undefined) => {
        if (!structureText) return null

        const sections: Record<string, string[]> = {}
        let currentSection = ""

        structureText.split("\n").forEach((line) => {
            const trimmedLine = line.trim()
            if (!trimmedLine) return // Skip empty lines

            // Heuristic: A line that doesn't start with whitespace and might contain a colon is a section header
            if (!trimmedLine.startsWith(" ") && !trimmedLine.startsWith("\t")) {
                const parts = trimmedLine.split(":")
                if (parts.length > 1 && parts[0].trim().length < 50) { // Avoid treating long lines as headers
                    currentSection = parts[0].trim()
                    const content = parts.slice(1).join(":").trim()
                    sections[currentSection] = content ? [content] : []
                } else {
                    currentSection = trimmedLine
                    sections[currentSection] = []
                }
            } else if (currentSection && sections[currentSection]) { // Content for the current section
                sections[currentSection].push(trimmedLine)
            } else if (!currentSection && trimmedLine) { // Content before any section detected
                // Default to a generic section if no header found yet
                const defaultSection = "General";
                if (!sections[defaultSection]) sections[defaultSection] = [];
                sections[defaultSection].push(trimmedLine);
            }
        })
        // Filter out empty sections
        return Object.fromEntries(Object.entries(sections).filter(([_, v]) => v.some(line => line.trim() !== "")));
    }

    // Extract constraints from description or structure
    const extractConstraints = (description: string, structureText?: string) => {
        const constraints: string[] = []

        // Look for constraints in the description
        const descriptionLines = description.split("\n")
        let inConstraintsSection = false

        for (const line of descriptionLines) {
            const lowerLine = line.toLowerCase().trim();
            if (lowerLine.startsWith("constraints:") || lowerLine.startsWith("constraint:")) {
                inConstraintsSection = true
                const afterColon = line.substring(line.toLowerCase().indexOf(":") + 1).trim();
                if (afterColon) constraints.push(afterColon); // Add content on the same line as "Constraints:"
                continue
            }

            if (inConstraintsSection) {
                // Heuristic to stop constraint parsing: encountering common section headers or too many blank lines
                if (
                    lowerLine === "" ||
                    lowerLine.startsWith("example") ||
                    lowerLine.startsWith("input:") ||
                    lowerLine.startsWith("output:") ||
                    lowerLine.startsWith("note:") ||
                    lowerLine.startsWith("notes:") ||
                    lowerLine.startsWith("function signature") ||
                    lowerLine.startsWith("follow up")
                ) {
                    inConstraintsSection = false
                } else if (line.trim()) {
                    constraints.push(line.trim())
                }
            }
        }

        if (constraints.length > 0) {
            return constraints.filter(c => c.length > 0); // Filter out any empty strings
        }

        // Otherwise, try to extract from parsed structure if available
        if (structureText) {
            const structureSections = parseStructure(structureText)
            if (structureSections && (structureSections["Constraints"] || structureSections["Constraint"])) {
                return (structureSections["Constraints"] || structureSections["Constraint"] || []).filter(c => c.length > 0);
            }
        }

        return []
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600 dark:text-gray-300">Loading problem...</p>
            </div>
        )
    }

    if (error || !problem) {
        return (
            <div className="text-center py-12 px-4">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{error || "Problem Not Found"}</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                    The problem you're looking for doesn't exist, has been removed, or an error occurred.
                </p>
                <Link
                    to="/admin/problems" // Adjust if your admin route is different
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                    Back to Problems
                </Link>
            </div>
        )
    }

    const acceptanceRate = problem.submissionCount && problem.submissionCount > 0
        ? Math.round(((problem.acceptedCount || 0) / problem.submissionCount) * 1000) / 10
        : 0

    const constraints = extractConstraints(problem.description, problem.structure)
    const parsedStructure = parseStructure(problem.structure)

    return (
        <div className="container mx-auto p-4 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-2">
                    <Link
                        to="/admin/problems" // Adjust if your admin route is different
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-fit"
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Problems</span>
                    </Link>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">{problem.title}</h1>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty || "N/A"}
                        </span>
                        {problem.hidden !== undefined && (
                            <span
                                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                    problem.hidden ? "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                }`}
                            >
                                {problem.hidden ? "Hidden" : "Visible"}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Link
                        to={`/admin/problems/${problem.slug}/edit`} // Adjust if your admin route is different
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                    >
                        <Edit size={16} />
                        <span>Edit</span>
                    </Link>
                    <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        <Trash2 size={16} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Problem Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Description Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Problem Description</h2>
                        </div>
                        <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    code: ({ node, inline, className, children, ...props }: CustomCodeRendererProps) => {
                                        const match = /language-(\w+)/.exec(className || "")
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={tomorrow}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-md"
                                                customStyle={{ margin: '1em 0', fontSize: '0.875em' }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={`${className} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm`} {...props}>
                                                {children}
                                            </code>
                                        )
                                    },
                                    h1: ({ node, ...props }: SimpleMarkdownComponentProps) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                                    h2: ({ node, ...props }: SimpleMarkdownComponentProps) => <h2 className="text-xl font-semibold mt-5 mb-2" {...props} />,
                                    h3: ({ node, ...props }: SimpleMarkdownComponentProps) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
                                    p: ({ node, ...props }: SimpleMarkdownComponentProps) => <p className="my-3 leading-relaxed" {...props} />,
                                    ul: ({ node, ...props }: SimpleMarkdownComponentProps) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                                    ol: ({ node, ...props }: SimpleMarkdownComponentProps) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                                    li: ({ node, ...props }: SimpleMarkdownComponentProps) => <li className="my-1" {...props} />,
                                    table: ({ node, ...props }: SimpleMarkdownComponentProps) => (
                                        <div className="overflow-x-auto my-4 border dark:border-gray-700 rounded-md">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }: SimpleMarkdownComponentProps) => <thead className="bg-gray-50 dark:bg-gray-700/50" {...props} />,
                                    th: ({ node, ...props }: SimpleMarkdownComponentProps) => (
                                        <th
                                            className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                            {...props}
                                        />
                                    ),
                                    td: ({ node, ...props }: SimpleMarkdownComponentProps) => <td className="px-4 py-2.5 whitespace-normal text-sm text-gray-700 dark:text-gray-300" {...props} />,
                                    a: ({ node, ...props }: SimpleMarkdownComponentProps) => <a className="text-blue-600 hover:underline dark:text-blue-400" {...props} />,
                                    hr: ({node, ...props}: SimpleMarkdownComponentProps) => <hr className="my-6 border-gray-200 dark:border-gray-600" {...props} />
                                }}
                            >
                                {problem.description}
                            </ReactMarkdown>
                        </div>
                    </section>

                    {/* Problem Structure Section */}
                    {parsedStructure && Object.keys(parsedStructure).length > 0 && (
                        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Code className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Problem Structure</h2>
                            </div>
                            <div className="space-y-4">
                                {Object.entries(parsedStructure).map(([section, lines], index) => (
                                    <div key={index} className="mb-3 last:mb-0">
                                        <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-1.5">{section}</h3>
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-1">
                                            {lines.map((line, i) => (
                                                <div key={i} className="font-mono text-xs md:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Constraints Section */}
                    {constraints.length > 0 && (
                        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Constraints</h2>
                            </div>
                            <ul className="space-y-2">
                                {constraints.map((constraint, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-amber-600 dark:text-amber-400 mt-1 text-lg leading-none">•</span>
                                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{constraint}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Test Cases Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                                <List className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Test Cases</h2>
                            </div>
                            {totalTestCases > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing {testCases.length > 0 ? testCasePage * testCaseSize + 1 : 0}-
                                    {Math.min((testCasePage + 1) * testCaseSize, totalTestCases)} of {totalTestCases}
                                </div>
                            )}
                        </div>

                        {testCasesLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="ml-3 text-gray-500 dark:text-gray-400">Loading test cases...</p>
                            </div>
                        ) : testCases.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No test cases available for this problem.</p>
                        ) : (
                            <div className="space-y-4">
                                {testCases.map((testCase, index) => (
                                    <div key={testCase.id || index} className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-700/30">
                                        <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Test Case #{testCasePage * testCaseSize + index + 1}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Input:</label>
                                                <pre className="bg-white dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                                    {testCase.input || "N/A"}
                                                </pre>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expected Output:</label>
                                                <pre className="bg-white dark:bg-gray-800 p-3 rounded-md overflow-x-auto font-mono text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                                    {testCase.output || "N/A"}
                                                </pre>
                                            </div>
                                        </div>
                                        {testCase.explanation && (
                                            <div className="mt-3">
                                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Explanation:</label>
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-md text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                                                    {testCase.explanation}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {totalTestCasePages > 1 && (
                            <div className="flex justify-center items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-x-2">
                                <button
                                    onClick={() => handleTestCasePageChange(testCasePage - 1)}
                                    disabled={testCasePage === 0 || testCasesLoading}
                                    className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Previous test case page"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    Page {testCasePage + 1} of {totalTestCasePages}
                                </div>
                                <button
                                    onClick={() => handleTestCasePageChange(testCasePage + 1)}
                                    disabled={testCasePage >= totalTestCasePages - 1 || testCasesLoading}
                                    className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Next test case page"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Column: Metadata & Stats */}
                <aside className="lg:col-span-1 space-y-6">
                    {/* Problem Details Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Details</h2>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500 dark:text-gray-400">Created:</span>
                                <span className="text-gray-700 dark:text-gray-300">{new Date(problem.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-500 dark:text-gray-400">Updated:</span>
                                <span className="text-gray-700 dark:text-gray-300">{new Date(problem.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Clock size={14} />Time Limit:</span>
                                <span className="text-gray-700 dark:text-gray-300">{problem.timeLimit || "N/A"} seconds</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Database size={14} />Memory Limit:</span>
                                <span className="text-gray-700 dark:text-gray-300">{problem.memoryLimit || "N/A"} MB</span>
                            </div>
                        </div>
                    </section>

                    {/* Tags Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Tag size={18} className="text-gray-600 dark:text-gray-400" />
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Tags</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {problem.tags && problem.tags.length > 0 ? (
                                problem.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 font-medium"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-500 dark:text-gray-400">No tags associated.</span>
                            )}
                        </div>
                    </section>

                    {/* Statistics Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Statistics</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{problem.submissionCount || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Accepted Submissions</div>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {problem.acceptedCount || 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Acceptance Rate</div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{acceptanceRate.toFixed(1)}%</div>
                                {problem.submissionCount && problem.submissionCount > 0 && (
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${acceptanceRate}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </aside>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100">
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="deleteModalTitle">
                                        Delete Problem
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-300">
                                            Are you sure you want to delete the problem "{problem.title}"? This action cannot be undone. All associated data will be permanently removed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
