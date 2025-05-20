import "./App.css";
// Removed BrowserRouter import as it's not needed here with createBrowserRouter
import { Outlet } from "react-router-dom"; // Import Outlet
import { Appbar } from "./components/layout/Appbar/Appbar.tsx";
import { Footer } from "./components/layout/Footer/Footer.tsx";
// AppRoutes import is no longer needed here as Outlet handles rendering
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminNavLink from "./components/layout/AdminNavLink.tsx";

function App() {
    return (
        <AuthProvider>
            <ToastContainer position="top-right" autoClose={3000} />
            <Appbar />
            <main className="content-container min-h-screen pt-20">
                <div className="fixed bottom-6 right-6 z-50">
                    <AdminNavLink/>
                </div>
                <Outlet/>
            </main>
            <Footer/>
        </AuthProvider>
    );
}

export default App;
