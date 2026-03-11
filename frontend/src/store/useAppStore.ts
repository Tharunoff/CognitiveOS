import { create } from 'zustand';
import { apiFetch } from '../lib/api';

interface User {
    id: string;
    email: string;
}

interface AppState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    token: null, // Will be hydrated in client components if needed
    isAuthenticated: false,
    login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));
