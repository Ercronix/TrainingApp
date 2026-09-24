import { View, Text, TouchableOpacity } from 'react-native';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTraining } from '@/hooks/useActiveTraining';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useTheme } from '@/hooks/useTheme';

// Screens the banner stays off: the session itself and the modals
const HIDDEN_ROUTES = new Set([
  '/training', '/add-exercise', '/log-exercise', '/create-split', '/create-workout',
  '/create-exercise', '/edit-split', '/edit-workout', '/edit-exercise',
]);

// Height of the floating tab bar plus its gap to the bottom edge (see app/(tabs)/_layout.tsx)
const TAB_BAR_OFFSET = 64 + 12;

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

  if (!activeTraining || segments[0] === '(auth)' || HIDDEN_ROUTES.has(pathname)) return null;

  // Bottom left: above the tab bar on tabs, level with the screens' bottom-right FAB elsewhere
  const bottom = insets.bottom + (segments[0] === '(tabs)' ? TAB_BAR_OFFSET + 8 : 32);

  return (
    <View style={{ position: 'absolute', left: 16, bottom }} pointerEvents="box-none">
      <TouchableOpacity
        className="bg-accent rounded-full h-10 px-4 flex-row items-center gap-2"
        style={{ shadowColor: '#131313', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }}
        onPress={() =>
          router.push({ pathname: '/training', params: { trainingLogId: activeTraining.id.toString() } })
        }
        accessibilityLabel={`Resume ${activeTraining.workoutName || activeTraining.splitName}`}
        activeOpacity={0.85}
      >
        <Ionicons name="flash" size={14} color={c.accentFg} />
        <Text className="text-accent-fg text-xs font-mono-bold">{formatElapsed(elapsedSeconds)}</Text>
      </TouchableOpacity>
    </View>
  );
}
