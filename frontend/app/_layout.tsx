import { Stack } from 'expo-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect, useCallback } from 'react';
import { useColorScheme } from 'nativewind';
import { useFonts, JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { getPalette, getThemeVars } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { storage } from '@/services/storage';
import { ConfirmDialogHost } from '@/components/ConfirmDialogHost';
import { queryClient, persister, CACHE_MAX_AGE } from '@/services/queryClient';
import "./styles/global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const customAccent = useThemeStore((s) => s.customAccent);
  const setCustomAccent = useThemeStore((s) => s.setCustomAccent);

  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    storage.getItem('color-scheme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setColorScheme(saved);
      }
    });
    storage.getItem('theme-id').then((saved) => {
      if (saved) setThemeId(saved);
    });
    storage.getItem('custom-accent').then((saved) => {
      if (saved) setCustomAccent(saved);
    });
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const isLight = colorScheme === 'light';
  const bgColor = getPalette(themeId, isLight ? 'light' : 'dark', customAccent).base;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }} onLayout={onLayoutRootView}>
      <StatusBar style={isLight ? 'dark' : 'light'} backgroundColor={bgColor} />
      <View style={[{ flex: 1 }, getThemeVars(themeId, isLight ? 'light' : 'dark', customAccent)]}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
          // Replay edits made offline (restored from storage) once we're back
          onSuccess={() => { void queryClient.resumePausedMutations(); }}
        >
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

              {/* Modals */}
              <Stack.Screen name="create-split"   options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="create-workout" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="create-exercise" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="log-exercise"   options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="edit-split"     options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="edit-workout"   options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="edit-exercise"  options={{ presentation: 'modal', headerShown: false }} />

              {/* Screens */}
              <Stack.Screen name="workouts"        options={{ headerShown: false }} />
              <Stack.Screen name="workout-detail"  options={{ headerShown: false }} />
              <Stack.Screen name="exercise-detail" options={{ headerShown: false }} />
              <Stack.Screen name="training"        options={{ headerShown: false }} />
              <Stack.Screen name="history-detail"  options={{ headerShown: false }} />
              <Stack.Screen name="library"         options={{ headerShown: false }} />
              <Stack.Screen name="one-rep-max"     options={{ headerShown: false }} />
            </Stack>
            <ConfirmDialogHost />
          </AuthProvider>
        </PersistQueryClientProvider>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return <AppLayout />;
}
