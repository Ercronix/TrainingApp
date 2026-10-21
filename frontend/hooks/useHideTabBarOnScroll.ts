import { useCallback, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useTabBarStore } from '@/store/tabBarStore';

// Distance scrolled in one direction before the bar reacts, so small jitters don't toggle it
const THRESHOLD = 12;
// Near the top the bar always shows
const TOP_ZONE = 24;

/**
 * Scroll props for a tab's list that hide the tab bar while scrolling down and bring it back on
 * scrolling up, like YouTube. Spread onto a ScrollView or FlatList.
 */
export function useHideTabBarOnScroll() {
    const setHidden = useTabBarStore((s) => s.setHidden);
    const lastY = useRef(0);
    // Where the current run of scrolling in one direction began
    const anchorY = useRef(0);

    const onScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            // Clamp away the overscroll bounce at either end, which would read as a direction change
            const maxY = Math.max(0, contentSize.height - layoutMeasurement.height);
            const y = Math.min(Math.max(contentOffset.y, 0), maxY);

            if (y <= TOP_ZONE) {
                setHidden(false);
            } else if ((y - lastY.current) * (lastY.current - anchorY.current) < 0) {
                // Direction changed: start measuring from here
                anchorY.current = lastY.current;
            }

            const delta = y - anchorY.current;
            if (delta > THRESHOLD) setHidden(true);
            else if (delta < -THRESHOLD) setHidden(false);

            lastY.current = y;
        },
        [setHidden],
    );

    return { onScroll, scrollEventThrottle: 16 };
}
