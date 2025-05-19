"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { Shield, Home, ArrowLeft } from "lucide-react"

const UnauthorizedPage: React.FC = () => {
    return (
        <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50 dark:from-[#020817] dark:to-[#0F172A]">
            <div className="w-full max-w-md text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                        <Shield className="h-12 w-12" />
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Access Denied</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    You don't have permission to access this page. Please contact an administrator if you believe this is an
                    error.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/">
                        <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
                            <Home className="h-5 w-5" />
                            Go to Home
                        </Button>
                    </Link>
                    <Button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default UnauthorizedPage
