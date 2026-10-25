'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface User {
    id: string;
    login: string;
    xp: number;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
    user: User | null;
    status: AuthStatus;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUserXp: (xp: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const initialized = useRef(false);

    const login = useCallback((token: string, userData: User) => {
        (window as any).__ACCESS_TOKEN__ = token;
        setUser(userData);
        setStatus('authenticated');
    }, []);

    const logout = useCallback(() => {
        (window as any).__ACCESS_TOKEN__ = null;
        setUser(null);
        setStatus('unauthenticated');
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
            .finally(() => window.location.replace("/"));
    }, []);

    const updateUserXp = useCallback((newXp: number) => {
        setUser(prev => prev ? { ...prev, xp: newXp } : null);
    }, []);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const initAuth = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                });
                const json = await res.json();

                if (res.ok && json.success && json.data.user) {
                    login(json.data.accessToken, json.data.user);
                } else {
                    setStatus('unauthenticated');
                }
            } catch (err) {
                setStatus('unauthenticated');
            }
        };

        initAuth();
    }, [login]);

    return (
        <AuthContext.Provider value={{ user, status, login, logout, updateUserXp }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};