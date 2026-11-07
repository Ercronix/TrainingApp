import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStretchRoutine } from '@/hooks/useStretchRoutine';
import { useStretchCheckIns } from '@/hooks/useStretchCheckIns';
import { Tactile } from '@/components/Tactile';
import { haptics } from '@/utils/haptics';
import { formatClock, routineSeconds } from '@/utils/stretch';

/** The daily stretch on the TRAIN tab: start the routine or tick today off, then a quiet done state. */
export function StretchCard() {
  const router = useRouter();
  const c = useTheme();
  const { routine, items } = useStretchRoutine();
  const { doneToday, streak, checkInToday, undoToday } = useStretchCheckIns();
  const name = routine?.name ?? 'Daily stretch';

  const streakText = (
    <Text className="text-muted text-xs">
      <Text className="text-primary font-mono-bold">{streak}</Text> day streak
    </Text>
  );

  if (doneToday) {
    return (
      <View className="bg-surface-done border-2 border-edge-done border-b-[6px] rounded-md p-5 mb-6 flex-row items-center gap-4">
        <View className="w-11 h-11 rounded-full bg-accent items-center justify-center">
          <Ionicons name="checkmark" size={20} color={c.accentFg} />
        </View>
        <TouchableOpacity className="flex-1" onPress={() => router.push('/stretch' as any)} accessibilityLabel={`${name}, done today`}>
          <Text className="text-accent-text text-[10px] tracking-[4px] mb-1" numberOfLines={1}>DONE TODAY</Text>
          {streakText}
        </TouchableOpacity>
        <TouchableOpacity
          className="px-2 py-3"
          onPress={() => {
            haptics.uncheck();
            undoToday();
          }}
          accessibilityLabel="Undo today's stretch"
        >
          <Text className="text-muted text-[9px] tracking-[3px]">UNDO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasItems = items.length > 0;
  return (
    <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md p-5 mb-6 gap-4">
      <TouchableOpacity
        className="flex-row justify-between items-start gap-3"
        onPress={() => router.push('/stretch' as any)}
        accessibilityLabel={`${name}, edit routine`}
      >
        <View className="flex-1">
          <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">DAILY STRETCH</Text>
          <Text className="text-primary text-2xl font-bold tracking-tight" numberOfLines={1}>{name}</Text>
        </View>
        <View className="items-end">
          {streakText}
          <Text className="text-muted text-xs">
            {hasItems
              ? `${items.length} ${items.length === 1 ? 'stretch' : 'stretches'} · ${formatClock(routineSeconds(items))}`
              : 'no stretches yet'}
          </Text>
        </View>
      </TouchableOpacity>
      <View className="flex-row gap-3">
        <Tactile
          className="rounded-md py-4 flex-row items-center justify-center gap-2"
          containerClassName="flex-1"
          onPress={() => router.push((hasItems ? '/stretch-session' : '/stretch') as any)}
          activeOpacity={0.85}
        >
          <Ionicons name={hasItems ? 'play' : 'add'} size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">{hasItems ? 'START' : 'SET UP'}</Text>
        </Tactile>
        {/* For days stretched without the guided session */}
        <Tactile
          variant="elevated"
          className="rounded-md py-4 px-5 flex-row items-center justify-center gap-2"
          onPress={() => {
            haptics.check();
            checkInToday();
          }}
          haptic={false}
          accessibilityLabel="Mark today's stretch as done"
        >
          <Ionicons name="checkmark" size={18} color={c.primary} />
          <Text className="text-primary text-sm font-bold tracking-[2px]">DONE</Text>
        </Tactile>
      </View>
    </View>
  );
}
