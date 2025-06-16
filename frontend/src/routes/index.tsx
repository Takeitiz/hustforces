import { createBrowserRouter, Navigate } from "react-router-dom"
import App from "../App"
import { HomePage } from "../pages/Home/HomePage"
import LoginPage from "../pages/Auth/LoginPage"
import { RegisterPage } from "../pages/Auth/RegisterPage"
import { ForgotPasswordPage } from "../pages/Auth/ForgotPasswordPage"
import { ProblemPage } from "../pages/Problem/ProblemPage"
import { ProfilePage } from "../pages/Profile/ProfilePage"
import { ContestsPage } from "../pages/Contest/ContestsPage"
import { ContestDetailPage } from "../pages/Contest/ContestDetailPage"
import { ContestLeaderboardPage } from "../pages/Contest/ContestLeaderboardPage"
import { SettingsPage } from "../pages/User/SettingsPage"
import { PrivacyPolicyPage } from "../pages/Legal/PrivacyPolicyPage"
import { TermsPage } from "../pages/Legal/TermsPage"
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
import { EditProblemPage } from "../pages/Admin/Problems/EditProblemPage.tsx"
import { RoomBrowser } from "../components/features/coderoom/RoomBrowser.tsx"
import CodeRoomPage from "../pages/CodeRoom/CodeRoomPage.tsx"
import { ProblemsPage } from "../pages/Problem/ProblemsPage.tsx"
import {UserSubmissionsPage} from "../pages/Profile/UserSubmissionsPage.tsx";
import {ContestProblemPage} from "../pages/Contest/ContestProblemPage.tsx";
import {StandingsPage} from "../pages/Standings/StandingsPage.tsx";
import {EditContestPage} from "../pages/Admin/Contests/EditContestPage.tsx";

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
                path: "problems",
                element: <ProblemsPage />,
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
                path: "standings",
                element: <StandingsPage />,
            },
            {
                path: "profile/:username/submissions",
                element: <UserSubmissionsPage />,
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
                path: "contests/:contestId/problem/:problemIndex",
                element: <ContestProblemPage />,
            },
            {
                path: "contests/:id/leaderboard",
                element: <ContestLeaderboardPage />,
            },
            {
                path: "settings",
                element: <SettingsPage />,
            },
            {
                path: "code-rooms",
                element: <RoomBrowser />,
            },
            {
                path: "code-room/:roomCode",
                element: <CodeRoomPage />,
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
                        path: "contests/:id",
                        element: <EditContestPage />,
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
