import { Animated, Platform, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTraining } from '@/hooks/useActiveTraining';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useTheme } from '@/hooks/useTheme';
import { useTabBarStore } from '@/store/tabBarStore';

import { Tactile } from '@/components/Tactile';
// Screens the banner stays off: the session itself and the modals
const HIDDEN_ROUTES = new Set([
  '/training', '/add-exercise', '/log-exercise', '/create-split', '/create-workout',
  '/create-exercise', '/edit-split', '/edit-workout', '/edit-exercise',
]);

// Height of the floating tab bar plus its gap to the bottom edge (see app/(tabs)/_layout.tsx)
const TAB_BAR_OFFSET = 72 + 12;

function formatElapsed(seconds: number | null): string {
  if (seconds == null) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mmss = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}

/** Floating shortcut back into an unfinished training session, shown on every other screen. */
export function ActiveTrainingBanner() {
  const { activeTraining } = useActiveTraining();
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const elapsedSeconds = useElapsedSeconds({ startedAt: activeTraining?.startedAt });
  const onTabs = segments[0] === '(tabs)';
  const tabBarHidden = useTabBarStore((s) => s.hidden);

  // Follows the tab bar down while it is scrolled out of view, to the off-tab position
  const dropBy = onTabs && tabBarHidden ? TAB_BAR_OFFSET + 8 - 32 : 0;
  const translateY = useRef(new Animated.Value(dropBy)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: dropBy,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [dropBy, translateY]);

  if (!activeTraining || segments[0] === '(auth)' || HIDDEN_ROUTES.has(pathname)) return null;

  // Bottom left: above the tab bar on tabs, level with the screens' bottom-right FAB elsewhere
  const bottom = insets.bottom + (onTabs ? TAB_BAR_OFFSET + 8 : 32);

  return (
    <Animated.View style={{ position: 'absolute', left: 16, bottom, transform: [{ translateY }] }} pointerEvents="box-none">
      <Tactile
        className="rounded-full h-10 px-4 flex-row items-center gap-2"
        style={{ shadowColor: '#131313', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
        onPress={() =>
          router.push({ pathname: '/training', params: { trainingLogId: activeTraining.id.toString() } })
        }
        accessibilityLabel={`Resume ${activeTraining.workoutName || activeTraining.splitName}`}
        activeOpacity={0.85}
      >
        <Ionicons name="flash" size={14} color={c.accentFg} />
        <Text className="text-accent-fg text-xs font-mono-bold">{formatElapsed(elapsedSeconds)}</Text>
      </Tactile>
    </Animated.View>
  );
}
