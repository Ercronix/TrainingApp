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

    loadToken();
  }, []);

  // Navigation basierend auf Auth Status
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User nicht eingeloggt → zu Login
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User eingeloggt aber auf Login Screen → zu Tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady]);

  if (!isReady) {
    // Loading Screen (optional)
    return null;
  }

  return <>{children}</>;
}