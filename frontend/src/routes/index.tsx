import { createBrowserRouter, Navigate } from "react-router-dom"
import App from "../App"
import {HomePage} from "../pages/Home/HomePage"
import LoginPage from "../pages/Auth/LoginPage"
import {RegisterPage} from "../pages/Auth/RegisterPage"
import {ForgotPasswordPage} from "../pages/Auth/ForgotPasswordPage"
import {ProblemPage} from "../pages/Problem/ProblemPage"
import {ProfilePage} from "../pages/Profile/ProfilePage"
import {ContestsPage} from "../pages/Contest/ContestsPage"
import {ContestDetailPage} from "../pages/Contest/ContestDetailPage"
import {ContestLeaderboardPage} from "../pages/Contest/ContestLeaderboardPage"
import {DiscussionForumPage} from "../pages/Discussion/DiscussionForumPage"
import {DiscussionDetailPage} from "../pages/Discussion/DiscussionDetailPage"
import {CreateDiscussionPage} from "../pages/Discussion/CreateDiscussionPage"
import {EditDiscussionPage} from "../pages/Discussion/EditDiscussionPage"
import {SolutionsPage} from "../pages/Solution/SolutionsPage"
import {SolutionDetailPage} from "../pages/Solution/SolutionDetailPage"
import {CreateSolutionPage} from "../pages/Solution/CreateSolutionPage"
import {EditSolutionPage} from "../pages/Solution/EditSolutionPage"
import {SettingsPage} from "../pages/User/SettingsPage"
import {PrivacyPolicyPage} from "../pages/Legal/PrivacyPolicyPage"
import {TermsPage} from "../pages/Legal/TermsPage"
import ErrorPages from "../pages/Error/ErrorPages"
import UnauthorizedPage from "../pages/Error/UnauthorizedPage"
import AdminDashboardPage from "../pages/Admin/AdminDashboardPage"
import AdminHomePage from "../pages/Admin/AdminHomePage"
import { AdminUsersPage } from "../pages/Admin/Users/AdminUsersPage"
import { AdminProblemsPage } from "../pages/Admin/Problems/AdminProblemsPage"
import { CreateProblemPage } from "../pages/Admin/Problems/CreateProblemPage"
import { ProblemDetailPage } from "../pages/Admin/Problems/ProblemDetailPage"
import { AdminContestsPage } from "../pages/Admin/Contests/AdminContestsPage"
import { CreateContestPage } from "../pages/Admin/Contests/CreateContestPage"
import { AdminImportPage } from "../pages/Admin/Import/AdminImportPage"
import {EditProblemPage} from "../pages/Admin/Problems/EditProblemPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        errorElement: <ErrorPages />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: "login",
                element: <LoginPage />,
            },
            {
                path: "register",
                element: <RegisterPage />,
            },
            {
                path: "forgot-password",
                element: <ForgotPasswordPage />,
            },
            {
                path: "problem/:slug",
                element: <ProblemPage />,
            },
            {
                path: "profile/:username",
                element: <ProfilePage />,
            },
            {
                path: "contests",
                element: <ContestsPage />,
            },
            {
                path: "contests/:id",
                element: <ContestDetailPage />,
            },
            {
                path: "contests/:id/leaderboard",
                element: <ContestLeaderboardPage />,
            },
            {
                path: "discussions",
                element: <DiscussionForumPage />,
            },
            {
                path: "discussions/:id",
                element: <DiscussionDetailPage />,
            },
            {
                path: "discussions/create",
                element: <CreateDiscussionPage />,
            },
            {
                path: "discussions/:id/edit",
                element: <EditDiscussionPage />,
            },
            {
                path: "solutions",
                element: <SolutionsPage />,
            },
            {
                path: "solutions/:id",
                element: <SolutionDetailPage />,
            },
            {
                path: "solutions/create",
                element: <CreateSolutionPage />,
            },
            {
                path: "solutions/:id/edit",
                element: <EditSolutionPage />,
            },
            {
                path: "settings",
                element: <SettingsPage />,
            },
            {
                path: "privacy-policy",
                element: <PrivacyPolicyPage />,
            },
            {
                path: "terms",
                element: <TermsPage />,
            },
            {
                path: "unauthorized",
                element: <UnauthorizedPage />,
            },
            // Admin routes
            {
                path: "admin",
                element: <AdminDashboardPage />,
                children: [
                    {
                        index: true,
                        element: <AdminHomePage />,
                    },
                    {
                        path: "users",
                        element: <AdminUsersPage />,
                    },
                    {
                        path: "problems",
                        element: <AdminProblemsPage />,
                    },
                    {
                        path: "problems/create",
                        element: <CreateProblemPage />,
                    },
                    {
                        path: "problems/:slug",
                        element: <ProblemDetailPage />,
                    },
                    {
                        path: "problems/:slug/edit",
                        element: <EditProblemPage />,
                    },
                    {
                        path: "contests",
                        element: <AdminContestsPage />,
                    },
                    {
                        path: "contests/create",
                        element: <CreateContestPage />,
                    },
                    {
                        path: "import",
                        element: <AdminImportPage />,
                    },
                ],
            },
            {
                path: "*",
                element: <Navigate to="/" replace />,
            },
        ],
    },
])

export default router
