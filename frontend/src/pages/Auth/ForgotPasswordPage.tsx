import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { Mail, ArrowRight, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email address");
            return;
        }

        setLoading(true);

        try {
            // This would be an API call to request password reset
            // await authService.requestPasswordReset(email);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            setResetSent(true);
            toast.success("Password reset link has been sent");
        } catch (error) {
            console.error("Error requesting password reset:", error);
            toast.error("Failed to request password reset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50 dark:from-[#020817] dark:to-[#0F172A]">
            <div
                className={`w-full max-w-md transition-all duration-700 transform ${
                    isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
            >
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-lg"></div>
                        <div className="relative bg-white dark:bg-gray-900 p-6 sm:p-10">
                            <div className="flex justify-center mb-6">
                                <Logo size="medium" />
                            </div>

                            {!resetSent ? (
                                <>
                                    <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-2">
                                        Forgot your password?
                                    </h2>
                                    <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                                        Enter your email address and we'll send you a link to reset your password
                                    </p>

                                    <form className="space-y-6" onSubmit={handleSubmit}>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    required
                                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    placeholder="Enter your email address"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Button
                                                type="submit"
                                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        Send Reset Link
                                                        <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="flex justify-center mb-6">
                                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Check your email
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the instructions to reset your password.
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        If you don't see the email, check your spam folder or request another reset link.
                                    </p>
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full flex items-center justify-center"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                    Sending...
                                                </>
                                            ) : (
                                                "Resend Email"
                                            )}
                                        </Button>
                                        <Link to="/login">
                                            <Button
                                                variant="outline"
                                                className="w-full flex items-center justify-center"
                                            >
                                                <ArrowLeft className="h-5 w-5 mr-2" />
                                                Back to Login
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Remember your password?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Log in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}