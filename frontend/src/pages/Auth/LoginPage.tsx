import {useState} from "react";
import {useAuth} from "../../contexts/AuthContext.tsx";
import {Link, useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {Label} from "../../components/ui/Label.tsx";
import {Button} from "../../components/ui/Button.tsx";


export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            await login({ username, password });
            navigate('/problems');
        } catch (error) {
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Login to Hustforces</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Access your account to track your progress and submit solutions
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <Label htmlFor="username">Username</Label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password">Password</Label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link to="/forgot-password" className="text-blue-500 hover:text-blue-700">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Sign in'}
                        </Button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-500 hover:text-blue-700">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}