import authService, {LoginCredentials, User} from "../service/authService.ts";
import {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {toast} from "react-toastify";

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials: LoginCredentials): Promise<void> => {
        try {
            setLoading(true);
            const response = await authService.login(credentials);
            setUser(response.user);
            toast.success('Logged in successfully');
        } catch (error) {
            toast.error('Login failed. Please check your credentials.');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = (): void => {
        authService.logout();
        setUser(null);
        toast.info('Logged out successfully');
    };

    const value = {
        user,
        isLoggedIn: !!user,
        loading,
        login,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}