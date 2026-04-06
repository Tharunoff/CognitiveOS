import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiFetch } from '../lib/api';

interface User {
    id: string;
    email: string;
}

interface AppState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loginTime: number | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    checkSession: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            loginTime: null,
            login: (user, token) => {
                localStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true, loginTime: Date.now() });
            },
            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null, isAuthenticated: false, loginTime: null });
            },
            checkSession: () => {
                const state = get();
                if (state.loginTime) {
                    const now = Date.now();
                    const hours24 = 24 * 60 * 60 * 1000;
                    if (now - state.loginTime >= hours24) {
                        state.logout();
                    }
                }
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
