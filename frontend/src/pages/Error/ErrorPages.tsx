import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";

// 404 Not Found Page
export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        404
                    </h1>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Page Not Found
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        className="flex items-center justify-center gap-2"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={16} />
                        Go Back
                    </Button>

                    <Link to="/">
                        <Button
                            variant="outline"
                            className="flex items-center justify-center gap-2"
                        >
                            <Home size={16} />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Generic Error Page
export function GenericErrorPage({
                                     title = "Something Went Wrong",
                                     message = "We're experiencing technical difficulties. Please try again later.",
                                     error,
                                     resetErrorBoundary
                                 }: {
    title?: string,
    message?: string,
    error?: Error,
    resetErrorBoundary?: () => void
}) {

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-600 dark:text-red-400"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    {title}
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    {message}
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-8 text-left">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300">Error details:</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 font-mono">
                            {error.message || "Unknown error"}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        className="flex items-center justify-center gap-2"
                        onClick={resetErrorBoundary || (() => window.location.reload())}
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </Button>

                    <Link to="/">
                        <Button
                            variant="outline"
                            className="flex items-center justify-center gap-2"
                        >
                            <Home size={16} />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Unauthorized Access Page (401)
export function UnauthorizedPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-red-500">
                        401
                    </h1>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Unauthorized Access
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    You don't have permission to access this page. Please log in or contact support if you believe this is an error.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/login">
                        <Button
                            className="flex items-center justify-center gap-2"
                        >
                            Log In
                        </Button>
                    </Link>

                    <Link to="/">
                        <Button
                            variant="outline"
                            className="flex items-center justify-center gap-2"
                        >
                            <Home size={16} />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Forbidden Access Page (403)
export function ForbiddenPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                        403
                    </h1>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Access Forbidden
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    You don't have permission to access this resource. If you believe this is an error, please contact support.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/">
                        <Button
                            className="flex items-center justify-center gap-2"
                        >
                            <Home size={16} />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Service Unavailable Page (503)
export function ServiceUnavailablePage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="mb-8">
                    <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                        503
                    </h1>
                </div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Service Unavailable
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    Our service is currently undergoing maintenance or experiencing high traffic. Please try again later.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        className="flex items-center justify-center gap-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw size={16} />
                        Refresh Page
                    </Button>
                </div>
            </div>
        </div>
    );
}