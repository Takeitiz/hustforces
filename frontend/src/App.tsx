import "./App.css";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Appbar } from "./components/layout/Appbar/Appbar.tsx";
import { Footer } from "./components/layout/Footer/Footer.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { CodeRoomProvider } from "./contexts/CodeRoomContext.tsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminNavLink from "./components/layout/AdminNavLink.tsx";
import { useEffect } from "react";
import { AUTH_ERROR_EVENT } from "./api/client.ts";

function App() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're on a page that should hide app bar/footer
    const shouldHideAppBarFooter =
        location.pathname.startsWith('/problem/') ||
        (location.pathname.includes('/contests/') && location.pathname.includes('/problem/')) ||
        location.pathname.startsWith('/code-room/'); // Added code room support

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
            <CodeRoomProvider>
                <ToastContainer position="top-right" autoClose={3000} />
                {!shouldHideAppBarFooter && <Appbar />}
                <main className={`min-h-screen ${!shouldHideAppBarFooter ? 'pt-20' : ''}`}>
                    {/* Only show admin nav link when app bar is hidden to avoid overlap */}
                    {shouldHideAppBarFooter && (
                        <div className="fixed top-6 right-6 z-50">
                            <AdminNavLink/>
                        </div>
                    )}
                    {!shouldHideAppBarFooter && (
                        <div className="fixed bottom-6 right-6 z-50">
                            <AdminNavLink/>
                        </div>
                    )}
                    <Outlet/>
                </main>
                {!shouldHideAppBarFooter && <Footer/>}
            </CodeRoomProvider>
        </AuthProvider>
    );
}

export default App;