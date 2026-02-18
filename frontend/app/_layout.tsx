import { Stack } from 'expo-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "./styles/global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Modals */}
            <Stack.Screen
              name="create-split"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="create-workout"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="create-exercise"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen
              name="log-exercise"
              options={{ presentation: 'modal', headerShown: false }}
            />

            {/* Screens */}
            <Stack.Screen name="workouts" options={{ headerShown: false }} />
            <Stack.Screen name="workout-detail" options={{ headerShown: false }} />
            <Stack.Screen name="exercise-detail" options={{ headerShown: false }} />
            <Stack.Screen name="training" options={{ headerShown: false }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}