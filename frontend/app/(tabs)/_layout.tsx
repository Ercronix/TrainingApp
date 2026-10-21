import { withLayoutContext } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import {
    createMaterialTopTabNavigator,
    MaterialTopTabNavigationEventMap,
    MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarStore } from '@/store/tabBarStore';
import { FloatingTabBar } from '@/components/FloatingTabBar';

// A pager of the main tabs: the neighbouring tab follows the finger while swiping
const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext<
    MaterialTopTabNavigationOptions,
    typeof Navigator,
    TabNavigationState<ParamListBase>,
    MaterialTopTabNavigationEventMap
>(Navigator);

const ICON_SIZE = 24;

export default function TabsLayout() {
    const c = useTheme();
    const setHidden = useTabBarStore((s) => s.setHidden);
    const swipeLocked = useTabBarStore((s) => s.swipeLocked);

    return (
        <SwipeTabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            tabBarPosition="bottom"
            style={{ backgroundColor: c.base }}
            // Every tab switch, by tap or swipe, brings the bar back
            screenListeners={{ focus: () => setHidden(false) }}
            screenOptions={{
                sceneStyle: { backgroundColor: c.base },
                swipeEnabled: !swipeLocked,
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
                    tabBarIcon: ({ color }) => <Ionicons name="barbell" size={ICON_SIZE} color={color} />,
                }}
            />
            <SwipeTabs.Screen
                name="dashboard"
                options={{
                    title: 'STATS',
                    tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={ICON_SIZE} color={color} />,
                }}
            />
            <SwipeTabs.Screen
                name="History"
                options={{
                    title: 'HISTORY',
                    tabBarIcon: ({ color }) => <Ionicons name="time" size={ICON_SIZE} color={color} />,
                }}
            />
            <SwipeTabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={ICON_SIZE} color={color} />,
                }}
            />
        </SwipeTabs>
    );
}
