import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { darkColors, lightColors } from '@/constants/theme';

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();
    const isLight = colorScheme === 'light';
    const c = isLight ? lightColors : darkColors;

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: c.accent,
                tabBarInactiveTintColor: c.muted,
                tabBarStyle: {
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    bottom: insets.bottom + 12,
                    height: 64,
                    borderTopWidth: 0,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: c.elevated,
                    backgroundColor: 'transparent',
                    paddingBottom: 5,
                    paddingTop: 8,
                    elevation: 0,
                    overflow: 'hidden',
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
                    title: 'SPLITS',
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
