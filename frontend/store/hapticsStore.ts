import { create } from 'zustand';

interface HapticsState {
    /** Whether the app gives haptic feedback (see utils/haptics.ts). */
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

export const useHapticsStore = create<HapticsState>((set) => ({
    enabled: true,
    setEnabled: (enabled) => set({ enabled }),
}));
