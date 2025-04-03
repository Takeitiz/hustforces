import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { UserProfile } from "../../types/profile.ts";
import profileService from "../../service/profileService.ts";
import { ProfileHeader } from "../../components/features/profile/ProfileHeader.tsx";
import { ProfileStats } from "../../components/features/profile/ProfileStats.tsx";
import { SubmissionHeatmap } from "../../components/features/profile/SubmissionHeatmap.tsx";
import { RankingChart } from "../../components/features/profile/RankingChart.tsx";
import { RecentSubmissions } from "../../components/features/profile/RecentSubmissions.tsx";
import { ProblemsSolvedChart } from "../../components/features/profile/ProblemsSolvedChart.tsx";
import { useAuth } from "../../contexts/AuthContext.tsx";

export function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isOwnProfile = !username || (currentUser && currentUser.username === username);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const data = isOwnProfile
                    ? await profileService.getMyProfile()
                    : await profileService.getUserProfile(username!);

                setProfile(data);
                setError(null);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load user profile");
                toast.error("Failed to load user profile");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [username, isOwnProfile, currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold">Error Loading Profile</h2>
                    <p className="mt-2">{error || "User profile could not be loaded."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2">
                    <SubmissionHeatmap calendarData={profile.submissionCalendar} />

                    <div className="mt-8">
                        <RankingChart rankingHistory={profile.rankingHistory} />
                    </div>

                    <div className="mt-8">
                        <RecentSubmissions submissions={profile.recentSubmissions} />
                    </div>
                </div>

                <div>
                    <ProfileStats stats={profile.stats} />

                    <div className="mt-8">
                        <ProblemsSolvedChart problemsByDifficulty={profile.problemsSolvedByDifficulty} />
                    </div>
                </div>
            </div>
        </div>
    );
}