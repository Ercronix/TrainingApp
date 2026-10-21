import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isReady, setIsReady] = useState(false);
    const c = useTheme();

    useEffect(() => {
        setTimeout(() => setIsReady(true), 100);
    }, []);

    if (!isReady) {
        return (
          <View className="flex-1 justify-center items-center bg-base">
              <ActivityIndicator size="large" color={c.accent} />
          </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}