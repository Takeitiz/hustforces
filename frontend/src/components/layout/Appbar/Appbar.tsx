import {Link} from "react-router-dom";

export function Appbar() {
    return (
        <header className="bg-gray-900 text-white px-4 md:px-6 py-3 flex items-center justify-between">
            <Link to = "/" className="flex items-center gap-2">
                <span className="text-lg, font-bold">Hustforces</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
                <Link to="/contests" className="hover:underline">Contests</Link>
                <Link to="/problems" className="hover:underline">Problems</Link>
                <Link to="/standings" className="hover:underline">Standings</Link>
            </nav>
        </header>
    )
}