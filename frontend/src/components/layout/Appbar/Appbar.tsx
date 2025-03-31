import {LogOut, User} from "lucide-react";
import {Link} from "react-router-dom";
import {Button} from "../../ui/Button.tsx";
import {useAuth} from "../../../contexts/AuthContext.tsx";

export function Appbar() {
    const { isLoggedIn, user, logout } = useAuth();

    return (
        <header className="bg-gray-900 text-white px-4 md:px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
                <span className="text-lg font-bold">Hustforces</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
                <Link to="/contests" className="hover:underline">Contests</Link>
                <Link to="/problems" className="hover:underline">Problems</Link>
                <Link to="/standings" className="hover:underline">Standings</Link>
            </nav>

            <div className="flex items-center gap-4">
                {isLoggedIn ? (
                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="flex items-center gap-2 hover:underline">
                            <User size={18} />
                            <span className="hidden sm:inline">{user?.username}</span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-white hover:bg-gray-800"
                        >
                            <LogOut size={18} className="mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-gray-800"
                            >
                                Login
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button
                                size="sm"
                                className="bg-[#4E7AFF] hover:bg-[#3A66E0]"
                            >
                                Register
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}