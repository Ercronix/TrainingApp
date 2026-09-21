import { create } from 'zustand';
import { DEFAULT_THEME_ID } from '@/constants/theme';

interface ThemeState {
    themeId: string;
    setThemeId: (id: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    themeId: DEFAULT_THEME_ID,
    setThemeId: (id) => set({ themeId: id }),
}));
