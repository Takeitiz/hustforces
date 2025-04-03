import { User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { UserProfile } from "../../../types/profile.ts";
import { Button } from "../../ui/Button.tsx";

interface ProfileHeaderProps {
    profile: UserProfile;
    isOwnProfile: boolean | null;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32"></div>

            <div className="p-6 -mt-16 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between">
                <div className="flex flex-col sm:flex-row items-center">
                    <div className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg">
                        {profile.user.profilePicture ? (
                            <img
                                src={profile.user.profilePicture}
                                alt={`${profile.user.username}'s profile`}
                                className="h-24 w-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 flex items-center justify-center">
                                <User size={48} />
                            </div>
                        )}
                    </div>

                    <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left">
                        <h1 className="text-2xl font-bold">{profile.user.username}</h1>
                        <p className="text-gray-500 dark:text-gray-400">Rank: {profile.stats.currentRank}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Member since {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {isOwnProfile && (
                    <div className="mt-4 sm:mt-0">
                        <Link to="/settings">
                            <Button className="flex items-center gap-2">
                                <Settings size={18} />
                                Edit Profile
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}