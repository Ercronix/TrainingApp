import { useEffect, useRef, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { storage } from '@/services/storage';
import { clearQueryCache } from '@/services/queryClient';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, setUser, logout } = useAuthStore();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        if (await authApi.hasSession()) {
          // me() transparently refreshes an expired access token
          const user = await authApi.me();
          const token = (await storage.getItem('authToken')) ?? '';
          setUser({ ...user, token, type: 'Bearer' });
        }
      } catch (error) {
        const cachedUser = await authApi.getCachedUser();
        if (axios.isAxiosError(error) && !error.response && cachedUser) {
          // Offline: keep the user signed in with cached data; requests retry once back online
          setUser({ ...cachedUser, token: (await storage.getItem('authToken')) ?? '', type: 'Bearer' });
        } else {
          console.error('Session validation failed:', error);
          await authApi.clearSession();
          logout();
        }
      } finally {
        setIsReady(true);
      }
    };
    void loadSession();
  }, []);

  // Whatever ended the session (logout button, rejected refresh token), don't leave the
  // previous user's cached data behind
  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) void clearQueryCache();
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

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
