/**
 * 인증 상태 관리 Context
 * 로그인 상태, 사용자 정보를 전역으로 관리
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getMe, login as apiLogin, logout as apiLogout, getAccessToken } from '../api/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Context Provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 초기 로드 시 사용자 정보 확인
    useEffect(() => {
        const initAuth = async () => {
            if (getAccessToken()) {
                const userData = await getMe();
                setUser(userData);
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    // 로그인
    const login = async (email: string, password: string) => {
        const response = await apiLogin(email, password);
        setUser(response.user);
    };

    // 로그아웃
    const logout = () => {
        apiLogout();
        setUser(null);
    };

    // 사용자 정보 새로고침
    const refreshUser = async () => {
        const userData = await getMe();
        setUser(userData);
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Auth Context 사용 Hook
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
