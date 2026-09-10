import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { useThemeColors } from '@/constants/theme';

export default function NotFoundScreen() {
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-canvas dark:bg-canvas-dark p-5">
        <Text className="text-xl font-bold text-ink dark:text-ink-dark">This screen doesn't exist.</Text>

        <Link href="/" className="mt-4 py-4">
          <Text style={{ fontSize: 14, color: colors.accent }}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
