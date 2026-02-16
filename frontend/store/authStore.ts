import { create } from 'zustand';
import { AuthResponse } from '@/types';

interface AuthState {
    user: AuthResponse | null;
    isAuthenticated: boolean;
    setUser: (user: AuthResponse | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,

    setUser: (user) => set({
        user,
        isAuthenticated: !!user
    }),

    logout: () => set({
        user: null,
        isAuthenticated: false
    }),
}));