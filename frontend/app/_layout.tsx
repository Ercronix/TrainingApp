import { Stack } from 'expo-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { getPalette, getThemeVars } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { storage } from '@/services/storage';
import "./styles/global.css";

const queryClient = new QueryClient();

function AppLayout() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);

  useEffect(() => {
    storage.getItem('color-scheme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setColorScheme(saved);
      }
    });
    storage.getItem('theme-id').then((saved) => {
      if (saved) setThemeId(saved);
    });
  }, []);

  const isLight = colorScheme === 'light';
  const bgColor = getPalette(themeId, isLight ? 'light' : 'dark').base;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isLight ? 'dark' : 'light'} backgroundColor={bgColor} />
      <View style={[{ flex: 1 }, getThemeVars(themeId, isLight ? 'light' : 'dark')]}>
        <QueryClientProvider client={queryClient}>
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
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return <AppLayout />;
}
