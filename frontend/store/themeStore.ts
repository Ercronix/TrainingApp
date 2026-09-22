import { create } from 'zustand';
import { DEFAULT_THEME_ID } from '@/constants/theme';

interface ThemeState {
    themeId: string;
    setThemeId: (id: string) => void;
    customAccent: string | null;
    setCustomAccent: (color: string | null) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    themeId: DEFAULT_THEME_ID,
    setThemeId: (id) => set({ themeId: id }),
    customAccent: null,
    setCustomAccent: (color) => set({ customAccent: color }),
}));
