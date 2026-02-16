import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';

export default function Index() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsReady(true), 100);
    }, []);

    if (!isReady) {
        return (
          <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#007AFF" />
          </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}