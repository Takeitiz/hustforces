import { LogOut, User, Menu, X, Moon, Sun } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "../../ui/Button.tsx"
import { useAuth } from "../../../contexts/AuthContext.tsx"
import { useState, useEffect } from "react"
import { Logo } from "../../ui/Logo.tsx"

export function Appbar() {
    const { isLoggedIn, user, logout } = useAuth()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains("dark")
    })

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    // Toggle dark mode
    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark")
            setIsDarkMode(false)
        } else {
            document.documentElement.classList.add("dark")
            setIsDarkMode(true)
        }
    }

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md py-3" : "bg-transparent py-5"
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between">
                    <Logo size="small" />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link
                            to="/contests"
                            className={`font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-600 dark:after:bg-blue-400 after:transition-all after:duration-300 ${
                                isScrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            Contests
                        </Link>
                        <Link
                            to="/problems"
                            className={`font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-600 dark:after:bg-blue-400 after:transition-all after:duration-300 ${
                                isScrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            Problems
                        </Link>
                        <Link
                            to="/standings"
                            className={`font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-600 dark:after:bg-blue-400 after:transition-all after:duration-300 ${
                                isScrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            Standings
                        </Link>
                        <Link
                            to="/code-rooms"
                            className={`font-medium transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-blue-600 dark:after:bg-blue-400 after:transition-all after:duration-300 ${
                                isScrolled ? "text-gray-700 dark:text-gray-200" : "text-gray-700 dark:text-gray-200"
                            }`}
                        >
                            Code Rooms
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* User actions */}
                        {isLoggedIn ? (
                            <div className="hidden md:flex items-center gap-4">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-full">
                                        <User size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-medium">{user?.username}</span>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                >
                                    <LogOut size={18} className="mr-2" />
                                    <span>Logout</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link to="/login">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                    >
                                        Register
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`md:hidden transition-all duration-300 overflow-hidden ${
                    mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="bg-white dark:bg-gray-900 shadow-lg px-4 py-5 space-y-4">
                    <nav className="flex flex-col space-y-4">
                        <Link
                            to="/contests"
                            className="font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Contests
                        </Link>
                        <Link
                            to="/problems"
                            className="font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Problems
                        </Link>
                        <Link
                            to="/standings"
                            className="font-medium py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Standings
                        </Link>
                    </nav>

                    {isLoggedIn ? (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            <Link
                                to="/profile"
                                className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <User size={18} />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={() => {
                                    logout()
                                    setMobileMenuOpen(false)
                                }}
                                className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    ) : (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col space-y-3">
                            <Link
                                to="/login"
                                className="py-2 px-3 rounded-md text-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="py-2 px-3 rounded-md text-center bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}

