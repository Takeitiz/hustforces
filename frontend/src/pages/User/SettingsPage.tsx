import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";
import { User, Key, Bell, Shield, Trash2, Save, Loader2 } from "lucide-react";

export function SettingsPage() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("profile");

    // Profile settings
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // Password settings
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Loading states
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        // Redirect if not logged in
        if (!isLoggedIn) {
            toast.error("You must be logged in to access settings");
            navigate("/login");
            return;
        }

        // Initialize form with user data
        if (user) {
            setUsername(user.username || "");
            setEmail(user.email || "");
            setProfilePicture(user.profilePicture || null);
        }
    }, [isLoggedIn, navigate, user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            // This would be an API call to update profile
            // await profileService.updateProfile({ username, email, profilePicture });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success("Profile updated successfully");
            // Update local user data would happen here
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        setPasswordLoading(true);

        try {
            // This would be an API call to change password
            // await authService.changePassword({ currentPassword, newPassword });

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            console.error("Error changing password:", error);
            toast.error("Failed to change password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) return;

        setDeleteLoading(true);

        try {
            // This would be an API call to delete account
            // await authService.deleteAccount();

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast.success("Account deleted successfully");
            // Logout and redirect would happen here
            navigate("/");
        } catch (error) {
            console.error("Error deleting account:", error);
            toast.error("Failed to delete account");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <TabsList className="flex p-0 bg-transparent">
                            <TabsTrigger
                                value="profile"
                                className="flex items-center px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                            >
                                <User size={16} className="mr-2" />
                                Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="flex items-center px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                            >
                                <Key size={16} className="mr-2" />
                                Password
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="flex items-center px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                            >
                                <Bell size={16} className="mr-2" />
                                Notifications
                            </TabsTrigger>
                            <TabsTrigger
                                value="privacy"
                                className="flex items-center px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                            >
                                <Shield size={16} className="mr-2" />
                                Privacy
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6">
                        <TabsContent value="profile">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="profile-picture" className="block text-sm font-medium mb-2">
                                            Profile Picture
                                        </label>
                                        <div className="flex items-center space-x-4">
                                            <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                {profilePicture ? (
                                                    <img
                                                        src={profilePicture}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <User size={36} className="text-gray-400 dark:text-gray-500" />
                                                )}
                                            </div>
                                            <Button type="button" variant="outline">
                                                Upload New Image
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="username" className="block text-sm font-medium mb-2">
                                            Username
                                        </label>
                                        <input
                                            id="username"
                                            type="text"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="bio" className="block text-sm font-medium mb-2">
                                            Bio
                                        </label>
                                        <textarea
                                            id="bio"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800 h-32"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            className="flex items-center"
                                            disabled={profileLoading}
                                        >
                                            {profileLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="password">
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="current-password" className="block text-sm font-medium mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            id="current-password"
                                            type="password"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-medium mb-2">
                                            New Password
                                        </label>
                                        <input
                                            id="new-password"
                                            type="password"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Password must be at least 8 characters
                                        </p>
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors dark:bg-gray-800"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <Button
                                            type="submit"
                                            className="flex items-center"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                "Change Password"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="notifications">
                            <div className="space-y-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Configure how you receive notifications and updates.
                                </p>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                id="email-contests"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="email-contests" className="ml-3 text-sm">
                                                New contests and competitions
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="email-solutions"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="email-solutions" className="ml-3 text-sm">
                                                Comments on your solutions
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="email-discussions"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="email-discussions" className="ml-3 text-sm">
                                                Replies to your discussions
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="email-marketing"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="email-marketing" className="ml-3 text-sm">
                                                Marketing and promotional emails
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">In-App Notifications</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                id="app-solutions"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="app-solutions" className="ml-3 text-sm">
                                                Comments on your solutions
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="app-discussions"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="app-discussions" className="ml-3 text-sm">
                                                Replies to your discussions
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="app-contests"
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="app-contests" className="ml-3 text-sm">
                                                Contest reminders
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button className="flex items-center">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Preferences
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="privacy">
                            <div className="space-y-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your privacy settings and account data.
                                </p>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">Profile Visibility</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                id="public-profile"
                                                type="radio"
                                                name="profile-visibility"
                                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                defaultChecked
                                            />
                                            <label htmlFor="public-profile" className="ml-3 text-sm">
                                                Public profile (visible to everyone)
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="limited-profile"
                                                type="radio"
                                                name="profile-visibility"
                                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="limited-profile" className="ml-3 text-sm">
                                                Limited profile (visible to registered users)
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="private-profile"
                                                type="radio"
                                                name="profile-visibility"
                                                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="private-profile" className="ml-3 text-sm">
                                                Private profile (only visible to you)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium mb-3">Data Privacy</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <Button variant="outline" className="w-full justify-start">
                                                Download My Data
                                            </Button>
                                        </div>
                                        <div>
                                            <Button
                                                variant="destructive"
                                                className="w-full justify-start flex items-center"
                                                onClick={handleDeleteAccount}
                                                disabled={deleteLoading}
                                            >
                                                {deleteLoading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Deleting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete My Account
                                                    </>
                                                )}
                                            </Button>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Warning: This action is permanent and cannot be undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button className="flex items-center">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Privacy Settings
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}