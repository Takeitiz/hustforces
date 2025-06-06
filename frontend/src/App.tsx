import "./App.css";
// Removed BrowserRouter import as it's not needed here with createBrowserRouter
import { Outlet, useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { Appbar } from "./components/layout/Appbar/Appbar.tsx";
import { Footer } from "./components/layout/Footer/Footer.tsx";
// AppRoutes import is no longer needed here as Outlet handles rendering
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminNavLink from "./components/layout/AdminNavLink.tsx";
import { useEffect } from "react"; // Import useEffect
import { AUTH_ERROR_EVENT } from "./api/client.ts"; // Import the auth error event

function App() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're on a problem page
    const isProblemPage = location.pathname.startsWith('/problem/');

    // Listen for auth errors and navigate to login
    useEffect(() => {
        const handleAuthError = () => {
            navigate('/login');
        };

        window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);

        return () => {
            window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
        };
    }, [navigate]);

    return (
        <AuthProvider>
            <ToastContainer position="top-right" autoClose={3000} />
            {!isProblemPage && <Appbar />}
            <main className={`min-h-screen ${!isProblemPage ? 'pt-20' : ''}`}>
                <div className="fixed bottom-6 right-6 z-50">
                    <AdminNavLink/>
                </div>
                <Outlet/>
            </main>
            {!isProblemPage && <Footer/>}
        </AuthProvider>
    );
}

export default App;