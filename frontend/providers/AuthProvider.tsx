import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, setUser, logout } = useAuthStore();

  // Token beim Start laden
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');

        if (token) {
          // TODO: Token validieren mit Backend
          // Für jetzt: Wenn Token existiert, als eingeloggt betrachten
          setUser({
            token,
            type: 'Bearer',
            userId: 0, // Wird später vom Backend geladen
            username: 'User',
            email: '',
          });
        }
      } catch (error) {
        console.error('Error loading token:', error);
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

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}