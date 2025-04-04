import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/Home/HomePage.tsx";
import { ProblemPage } from "../pages/Problem/ProblemPage.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import { LoginPage } from "../pages/Auth/LoginPage.tsx";
import { RegisterPage } from "../pages/Auth/RegisterPage.tsx";
import { ForgotPasswordPage } from "../pages/Auth/ForgotPasswordPage.tsx";
import { JSX } from "react";
import { ProfilePage } from "../pages/Profile/ProfilePage.tsx";
import { DiscussionForumPage } from "../pages/Discussion/DiscussionForumPage.tsx";
import { DiscussionDetailPage } from "../pages/Discussion/DiscussionDetailPage.tsx";
import { CreateDiscussionPage } from "../pages/Discussion/CreateDiscussionPage.tsx";
import { EditDiscussionPage } from "../pages/Discussion/EditDiscussionPage.tsx";
import { SolutionsPage } from "../pages/Solution/SolutionsPage.tsx";
import { SolutionDetailPage } from "../pages/Solution/SolutionDetailPage.tsx";
import { CreateSolutionPage } from "../pages/Solution/CreateSolutionPage.tsx";
import { EditSolutionPage } from "../pages/Solution/EditSolutionPage.tsx";
import { SettingsPage } from "../pages/User/SettingsPage.tsx";
import { TermsPage } from "../pages/Legal/TermsPage.tsx";
import { PrivacyPolicyPage } from "../pages/Legal/PrivacyPolicyPage.tsx";
import { NotFoundPage, UnauthorizedPage, ForbiddenPage } from "../pages/Error/ErrorPages.tsx";

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
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            {/* Error Pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Problem routes */}
            <Route path="/problem/:problemId" element={<ProblemPage />} />

            {/* Discussion routes */}
            <Route path="/discussions" element={<DiscussionForumPage />} />
            <Route path="/discussions/:discussionId" element={<DiscussionDetailPage />} />
            <Route path="/problem/:problemId/discussions" element={<DiscussionForumPage />} />

            {/* Solution routes */}
            <Route path="/solutions/:solutionId" element={<SolutionDetailPage />} />
            <Route path="/problem/:problemId/solutions" element={<SolutionsPage />} />

            {/* Profile routes */}
            <Route path="/profile/:username?" element={<ProfilePage />} />

            {/* Protected routes */}
            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/discussions/create"
                element={
                    <ProtectedRoute>
                        <CreateDiscussionPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/problem/:problemId/discussions/create"
                element={
                    <ProtectedRoute>
                        <CreateDiscussionPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/discussions/:discussionId/edit"
                element={
                    <ProtectedRoute>
                        <EditDiscussionPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/problem/:problemId/solutions/create"
                element={
                    <ProtectedRoute>
                        <CreateSolutionPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/solutions/:solutionId/edit"
                element={
                    <ProtectedRoute>
                        <EditSolutionPage />
                    </ProtectedRoute>
                }
            />

            {/* Routes that will be added later (for navigation) */}
            <Route path="/problems" element={<div>Problems page (coming soon)</div>} />
            <Route path="/contests" element={<div>Contests page (coming soon)</div>} />
            <Route path="/standings" element={<div>Standings page (coming soon)</div>} />

            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}