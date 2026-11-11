import { create } from 'zustand';
import { DEFAULT_GLASS_OPACITY, DEFAULT_THEME_ID } from '@/constants/theme';

interface ThemeState {
    themeId: string;
    setThemeId: (id: string) => void;
    customAccent: string | null;
    setCustomAccent: (color: string | null) => void;
    /** How opaque the cards of a glass theme are, 0 to 1. */
    glassOpacity: number;
    setGlassOpacity: (opacity: number) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
    themeId: DEFAULT_THEME_ID,
    setThemeId: (id) => set({ themeId: id }),
    customAccent: null,
    setCustomAccent: (color) => set({ customAccent: color }),
    glassOpacity: DEFAULT_GLASS_OPACITY,
    setGlassOpacity: (opacity) => set({ glassOpacity: opacity }),
}));
