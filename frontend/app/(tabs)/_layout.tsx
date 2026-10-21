import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { BlurView } from 'expo-blur';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { getPalette } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { useTabBarStore } from '@/store/tabBarStore';
import { SwipeTabs } from '@/components/SwipeTabs';

// Height of the floating tab bar plus its gap to the bottom edge
const TAB_BAR_OFFSET = 72 + 12;

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isLight = colorScheme === 'light';
    const themeId = useThemeStore((s) => s.themeId);
    const customAccent = useThemeStore((s) => s.customAccent);
    const c = getPalette(themeId, isLight ? 'light' : 'dark', customAccent);
    const hidden = useTabBarStore((s) => s.hidden);
    const setHidden = useTabBarStore((s) => s.setHidden);

    // Slides the bar below the screen's bottom edge while a tab's list scrolls down
    const hideOffset = insets.bottom + TAB_BAR_OFFSET + 8;
    const translateY = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(translateY, {
            toValue: hidden ? hideOffset : 0,
            duration: hidden ? 200 : 250,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, [hidden, hideOffset, translateY]);

    return (
        <Tabs
            screenLayout={({ children, navigation }) => <SwipeTabs navigation={navigation}>{children}</SwipeTabs>}
            // Every tab switch, by tap or swipe, brings the bar back
            screenListeners={{ focus: () => setHidden(false) }}
            screenOptions={{
                animation: 'shift',
                tabBarActiveTintColor: c.accent,
                tabBarInactiveTintColor: c.muted,
                tabBarStyle: {
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    bottom: insets.bottom + 12,
                    // 64 of content plus the 2px top and 6px bottom border
                    height: 72,
                    borderRadius: 24,
                    // Raised like the cards: a rim with a thicker bottom lip
                    borderWidth: 2,
                    borderTopWidth: 2,
                    borderBottomWidth: 6,
                    borderColor: c.edge,
                    backgroundColor: 'transparent',
                    paddingBottom: 5,
                    paddingTop: 8,
                    elevation: 0,
                    overflow: 'hidden',
                    transform: [{ translateY }],
                },
                tabBarBackground: () => (
                    <BlurView
                        intensity={isLight ? 60 : 40}
                        tint={isLight ? 'light' : 'dark'}
                        experimentalBlurMethod="dimezisBlurView"
                        style={StyleSheet.absoluteFill}
                    >
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface, opacity: isLight ? 0.55 : 0.45 }]} />
                    </BlurView>
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    letterSpacing: 0.5,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'TRAIN',
                    tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'STATS',
                    tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="History"
                options={{
                    title: 'HISTORY',
                    tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
