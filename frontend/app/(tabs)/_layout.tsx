import { TopTabs as SwipeTabs } from 'expo-router/js-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarStore } from '@/store/tabBarStore';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TabScene } from '@/components/TabScene';

const ICON_SIZE = 24;

// A pager of the main tabs: the neighbouring tab follows the finger while swiping
export default function TabsLayout() {
    const c = useTheme();
    const setHidden = useTabBarStore((s) => s.setHidden);
    const swipeLocked = useTabBarStore((s) => s.swipeLocked);

    return (
        <SwipeTabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            tabBarPosition="bottom"
            // Tapped tabs fade in (see TabScene) instead of the pager scrolling past the tabs in between
            screenLayout={({ route, navigation, children }) => (
                <TabScene route={route} navigation={navigation}>{children}</TabScene>
            )}
            // A glass theme shows the aurora of the stack screen below (see app/_layout.tsx)
            style={{ backgroundColor: c.glass ? 'transparent' : c.base }}
            // Every tab switch, by tap or swipe, brings the bar back
            screenListeners={{ focus: () => setHidden(false) }}
            screenOptions={{
                sceneStyle: { backgroundColor: c.glass ? 'transparent' : c.base },
                swipeEnabled: !swipeLocked,
                animationEnabled: false,
                // Mount a tab when it is next to the current one, so swiping never shows a blank page
                lazy: true,
                lazyPreloadDistance: 1,
                lazyPlaceholder: () => <View className="flex-1 bg-base" />,
            }}
        >
            <SwipeTabs.Screen
                name="index"
                options={{
                    title: 'TRAIN',
                    // FloatingTabBar passes plain color strings
                    tabBarIcon: ({ color }) => <Ionicons name="barbell" size={ICON_SIZE} color={color as string} />,
                }}
            />
            <SwipeTabs.Screen
                name="dashboard"
                options={{
                    title: 'STATS',
                    tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={ICON_SIZE} color={color as string} />,
                }}
            />
            <SwipeTabs.Screen
                name="History"
                options={{
                    title: 'HISTORY',
                    tabBarIcon: ({ color }) => <Ionicons name="time" size={ICON_SIZE} color={color as string} />,
                }}
            />
            <SwipeTabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={ICON_SIZE} color={color as string} />,
                }}
            />
        </SwipeTabs>
    );
}
