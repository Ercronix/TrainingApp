import { Platform } from 'react-native';
import { useTabBarStore } from '@/store/tabBarStore';

const noop = () => {};

/**
 * Keeps the tab pager from swiping while a pan inside a tab (a swipeable row, a chart scrub) handles
 * the touch. Natively the pan claims the touch first by itself. On web the pager claims moves
 * through JS responders, which a gesture-handler pan can't refuse, so the pager is locked from the
 * touch's start until the pan ends or fails; a swipe the pan can't use still switches tabs.
 * Spread `lockProps` on the pan's view and call `unlock` from the gesture's onFinalize.
 */
export function useTabSwipeLock() {
    const setSwipeLocked = useTabBarStore((s) => s.setSwipeLocked);
    if (Platform.OS !== 'web') return { lockProps: {}, unlock: noop };
    return {
        lockProps: { onPointerDown: () => setSwipeLocked(true) },
        unlock: () => setSwipeLocked(false),
    };
}
