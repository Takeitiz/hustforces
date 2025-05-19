import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Home } from "lucide-react";

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

export default NotFoundPage;