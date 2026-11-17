import { create } from 'zustand';

interface SoundState {
    /** Whether the rest timer plays a sound when the rest is over (see utils/restTimerNotifications.ts). */
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
    enabled: true,
    setEnabled: (enabled) => set({ enabled }),
}));
