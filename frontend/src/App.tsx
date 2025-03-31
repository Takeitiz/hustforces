import './App.css'
import {BrowserRouter} from "react-router-dom";
import {Appbar} from "./components/layout/Appbar/Appbar.tsx";
import {Footer} from "./components/layout/Footer/Footer.tsx";
import {AppRoutes} from "./routes";
import {AuthProvider} from "./contexts/AuthContext.tsx";
import {ToastContainer} from "react-toastify";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <ToastContainer position="top-right" autoClose={3000} />
                <Appbar />
                <main className="content-container min-h-screen">
                    <AppRoutes />
                </main>
                <Footer />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
