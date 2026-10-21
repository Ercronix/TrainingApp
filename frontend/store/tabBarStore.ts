import { create } from 'zustand';

interface TabBarState {
    /** Whether the floating tab bar is slid out of view, as on scrolling down a tab's list. */
    hidden: boolean;
    setHidden: (hidden: boolean) => void;
    /** Whether a row or chart is handling the current touch, so the tab pager must not swipe (web only). */
    swipeLocked: boolean;
    setSwipeLocked: (swipeLocked: boolean) => void;
}

export const useTabBarStore = create<TabBarState>((set) => ({
    hidden: false,
    setHidden: (hidden) => set((s) => (s.hidden === hidden ? s : { hidden })),
    swipeLocked: false,
    setSwipeLocked: (swipeLocked) => set((s) => (s.swipeLocked === swipeLocked ? s : { swipeLocked })),
}));
