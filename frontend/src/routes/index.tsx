import {Navigate, Route, Routes} from "react-router-dom";
import {HomePage} from "../pages/Home/HomePage.tsx";
import {ProblemPage} from "../pages/Problem/ProblemPage.tsx";
import {useAuth} from "../contexts/AuthContext.tsx";
import {LoginPage} from "../pages/Auth/LoginPage.tsx";
import {RegisterPage} from "../pages/Auth/RegisterPage.tsx";
import {JSX} from "react";
import {ProfilePage} from "../pages/Profile/ProfilePage.tsx";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { isLoggedIn, loading } = useAuth();

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/problem/:problemId" element={<ProblemPage />} />
            <Route path="/profile/:username?" element={<ProfilePage />} />

            {/* Routes that will be added later (for navigation) */}
            <Route path="/problems" element={<div>Problems page (coming soon)</div>} />
            <Route path="/contests" element={<div>Contests page (coming soon)</div>} />
            <Route path="/standings" element={<div>Standings page (coming soon)</div>} />

            {/* Protected routes */}
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <div>User profile page (coming soon)</div>
                    </ProtectedRoute>
                }
            />

            {/* 404 route */}
            <Route path="*" element={<div className="flex justify-center items-center h-screen">Page not found</div>} />
        </Routes>
    );
}