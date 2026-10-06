import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { TrainingLog } from '@/types';
import { startOfWeek } from '@/utils/stats';

interface Props {
  history: TrainingLog[];
}

const DAY_MS = 86_400_000;

// Calendar day i of the week starting at weekStart (DST-safe, unlike adding i * 24h)
const dayOf = (weekStart: number, i: number) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + i);
  return d;
};

/** Monday to Sunday of the current week: trained days are checked, today is ringed. */
export function WeekStrip({ history }: Props) {
  const c = useTheme();
  const weekStart = startOfWeek(Date.now());
  const today = new Date().getDay();
  const todayIndex = (today + 6) % 7;
  // First workout completed on each day of the week
  const trained: (string | null)[] = Array(7).fill(null);
  for (const log of history) {
    if (!log.isCompleted) continue;
    const date = new Date(log.completedAt ?? log.startedAt);
    date.setHours(0, 0, 0, 0);
    const day = Math.round((date.getTime() - weekStart) / DAY_MS);
    if (day >= 0 && day < 7 && trained[day] == null) trained[day] = log.workoutName || log.splitName || '';
  }
  const sessions = trained.filter((t) => t != null).length;

  return (
    <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md px-4 py-3.5 mb-3 gap-2.5">
      <View className="flex-row justify-between items-baseline">
        <Text className="text-muted text-[10px] tracking-[3px]">THIS WEEK</Text>
        <Text className="text-muted text-xs">
          <Text className="text-primary font-mono-bold">{sessions}</Text> {sessions === 1 ? 'session' : 'sessions'}
        </Text>
      </View>
      <View className="flex-row justify-between">
        {trained.map((name, i) => {
          const label = dayOf(weekStart, i).toLocaleDateString(undefined, { weekday: 'narrow' });
          const isToday = i === todayIndex;
          return (
            <View
              key={i}
              className="items-center gap-1.5"
              accessibilityLabel={`${label}${name != null ? `, trained ${name}` : ''}${isToday ? ', today' : ''}`}
            >
              <Text className={`text-[10px] ${isToday ? 'text-accent-text font-bold' : 'text-muted'}`}>{label}</Text>
              <View
                className={`w-9 h-9 rounded-full justify-center items-center ${name != null ? 'bg-accent' : isToday ? 'border-2 border-accent' : 'bg-elevated'}`}
              >
                {name != null && <Ionicons name="checkmark" size={16} color={c.accentFg} />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
