import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, setUser, logout } = useAuthStore();

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');

        if (token) {
          const user = await authApi.me();
          setUser({ ...user, token, type: 'Bearer' });
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        await SecureStore.deleteItemAsync('authToken');
        logout();
      } finally {
        setIsReady(true);
      }
    };

    void loadToken();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady]);

  if (!isReady) return null;

  return <>{children}</>;
}