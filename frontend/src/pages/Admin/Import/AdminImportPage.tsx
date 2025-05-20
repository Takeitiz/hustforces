"use client"
import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "../../../components/ui/Button"
import adminService from "../../../service/adminService"
import { Download, Database, Code, AlertTriangle, CheckCircle, Loader2, FileCode } from "lucide-react"

export function AdminImportPage() {
    const [importSlug, setImportSlug] = useState("")
    const [boilerplateSlug, setBoilerplateSlug] = useState("")
    const [importLoading, setImportLoading] = useState(false)
    const [importAllLoading, setImportAllLoading] = useState(false)
    const [seedLanguagesLoading, setSeedLanguagesLoading] = useState(false)
    const [boilerplateLoading, setBoilerplateLoading] = useState(false)
    const [importResult, setImportResult] = useState<{
        success: boolean
        message: string
    } | null>(null)

    const handleImportProblem = async () => {
        if (!importSlug.trim()) {
            toast.error("Please enter a problem slug")
            return
        }

        setImportLoading(true)
        setImportResult(null)
        try {
            const result = await adminService.importProblem(importSlug.trim())
            setImportResult({
                success: true,
                message: result || "Problem imported successfully",
            })
            toast.success("Problem imported successfully")
        } catch (error) {
            console.error("Failed to import problem:", error)
            setImportResult({
                success: false,
                message: "Failed to import problem. Please check the slug and try again.",
            })
            toast.error("Failed to import problem")
        } finally {
            setImportLoading(false)
        }
    }

    const handleImportAllProblems = async () => {
        setImportAllLoading(true)
        setImportResult(null)
        try {
            const result = await adminService.importAllProblems()
            setImportResult({
                success: true,
                message: result || "All problems imported successfully",
            })
            toast.success("All problems imported successfully")
        } catch (error) {
            console.error("Failed to import all problems:", error)
            setImportResult({
                success: false,
                message: "Failed to import all problems. Please try again later.",
            })
            toast.error("Failed to import all problems")
        } finally {
            setImportAllLoading(false)
        }
    }

    const handleSeedLanguages = async () => {
        setSeedLanguagesLoading(true)
        setImportResult(null)
        try {
            const result = await adminService.seedLanguages()
            setImportResult({
                success: true,
                message: result || "Languages seeded successfully",
            })
            toast.success("Languages seeded successfully")
        } catch (error) {
            console.error("Failed to seed languages:", error)
            setImportResult({
                success: false,
                message: "Failed to seed languages. Please try again later.",
            })
            toast.error("Failed to seed languages")
        } finally {
            setSeedLanguagesLoading(false)
        }
    }

    const handleGenerateBoilerplate = async () => {
        if (!boilerplateSlug.trim()) {
            toast.error("Please enter a problem slug")
            return
        }

        setBoilerplateLoading(true)
        setImportResult(null)
        try {
            const result = await adminService.generateBoilerplate(boilerplateSlug.trim())
            setImportResult({
                success: true,
                message: result || "Boilerplate code generated successfully",
            })
            toast.success("Boilerplate code generated successfully")
        } catch (error) {
            console.error("Failed to generate boilerplate:", error)
            setImportResult({
                success: false,
                message: "Failed to generate boilerplate code. Please check the slug and try again.",
            })
            toast.error("Failed to generate boilerplate code")
        } finally {
            setBoilerplateLoading(false)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Import Data</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                        <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Problem</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Import a specific problem by its slug. This will fetch the problem data and create it in the system.
                    </p>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={importSlug}
                            onChange={(e) => setImportSlug(e.target.value)}
                            placeholder="Enter problem slug"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <Button
                            onClick={handleImportProblem}
                            disabled={importLoading || !importSlug.trim()}
                            className="flex items-center gap-2"
                        >
                            {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            {importLoading ? "Importing..." : "Import"}
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                        <Database className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import All Problems</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Import all available problems from the source. This may take some time depending on the number of problems.
                    </p>
                    <div className="flex justify-end">
                        <Button onClick={handleImportAllProblems} disabled={importAllLoading} className="flex items-center gap-2">
                            {importAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                            {importAllLoading ? "Importing..." : "Import All Problems"}
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                        <Code className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Seed Languages</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Seed the system with supported programming languages. This is required for problem submissions.
                    </p>
                    <div className="flex justify-end">
                        <Button onClick={handleSeedLanguages} disabled={seedLanguagesLoading} className="flex items-center gap-2">
                            {seedLanguagesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Code className="h-4 w-4" />}
                            {seedLanguagesLoading ? "Seeding..." : "Seed Languages"}
                        </Button>
                    </div>
                </div>

                {/* New section for generating boilerplate code */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                        <FileCode className="h-6 w-6 text-orange-600 dark:text-orange-400 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generate Boilerplate</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Generate boilerplate code for a specific problem. This creates starter code templates for all supported
                        languages.
                    </p>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={boilerplateSlug}
                            onChange={(e) => setBoilerplateSlug(e.target.value)}
                            placeholder="Enter problem slug"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <Button
                            onClick={handleGenerateBoilerplate}
                            disabled={boilerplateLoading || !boilerplateSlug.trim()}
                            className="flex items-center gap-2"
                        >
                            {boilerplateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCode className="h-4 w-4" />}
                            {boilerplateLoading ? "Generating..." : "Generate"}
                        </Button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Important Notes</h2>
                    </div>
                    <ul className="text-gray-600 dark:text-gray-400 space-y-2">
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Importing problems may take some time depending on the size and complexity.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>Make sure to seed languages before allowing users to submit solutions.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                Imported problems will be hidden by default. You can make them visible from the Problems page.
              </span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                Generate boilerplate code after importing problems to create starter templates for all languages.
              </span>
                        </li>
                    </ul>
                </div>
            </div>

            {importResult && (
                <div
                    className={`mt-6 p-4 rounded-lg ${
                        importResult.success
                            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    }`}
                >
                    <div className="flex items-start">
                        {importResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                        )}
                        <div>
                            <h3
                                className={`font-medium ${
                                    importResult.success ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                                }`}
                            >
                                {importResult.success ? "Success" : "Error"}
                            </h3>
                            <p
                                className={`mt-1 text-sm ${
                                    importResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                                }`}
                            >
                                {importResult.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
