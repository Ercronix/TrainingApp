import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TrainingLog } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { blendHex } from '@/utils/color';
import { formatNumber, startOfWeek, totalsOf } from '@/utils/stats';

const WEEKS = 18;
const DAY_LABELS = ['M', '', 'W', '', 'F', '', 'S'];
// The faintest and strongest fill of a trained day, as the share of the accent in the card color
const MIN_FILL = 0.35;
const LEGEND_STEPS = [0.25, 0.5, 0.75, 1];

interface Day {
  time: number;
  future: boolean;
  today: boolean;
  volume: number;
  sessions: string[];
}

const dayKey = (time: number) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * The last 18 weeks as a grid of days, one column per week, each trained day filled by how much
 * was lifted. Shows gaps and regularity over months, which the 7-day streak can't. Tapping a day
 * names its session.
 */
export function ConsistencyCalendar({ logs }: { logs: TrainingLog[] }) {
  const c = useTheme();
  const [selected, setSelected] = useState<number | null>(null);

  const { weeks, maxVolume, perWeek, weekStreak, total } = useMemo(() => {
    const now = Date.now();
    const byDay = new Map<string, { volume: number; sessions: string[] }>();
    for (const log of logs) {
      if (!log.isCompleted) continue;
      const key = dayKey(new Date(log.completedAt ?? log.startedAt).getTime());
      const day = byDay.get(key) ?? { volume: 0, sessions: [] };
      day.volume += totalsOf(log).volume;
      day.sessions.push(log.workoutName || log.splitName);
      byDay.set(key, day);
    }
    const thisWeek = new Date(startOfWeek(now));
    const todayKey = dayKey(now);
    const grid: Day[][] = Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        // By calendar date, not a multiple of 24 hours, so a clock change doesn't shift a day
        const date = new Date(thisWeek);
        date.setDate(date.getDate() - (WEEKS - 1 - w) * 7 + d);
        const key = dayKey(date.getTime());
        const day = byDay.get(key);
        return {
          time: date.getTime(),
          future: date.getTime() > now,
          today: key === todayKey,
          volume: day?.volume ?? 0,
          sessions: day?.sessions ?? [],
        };
      }));
    const trained = (week: Day[]) => week.some((d) => d.sessions.length > 0);
    // Weeks in a row with a session, counting back from this week (which may still be empty)
    let streak = 0;
    for (let w = WEEKS - 1; w >= 0; w--) {
      if (trained(grid[w])) streak++;
      else if (w < WEEKS - 1) break;
    }
    const days = grid.flat();
    const sessionCount = days.reduce((sum, d) => sum + d.sessions.length, 0);
    return {
      weeks: grid,
      maxVolume: Math.max(0, ...days.map((d) => d.volume)),
      perWeek: sessionCount / WEEKS,
      weekStreak: streak,
      total: sessionCount,
    };
  }, [logs]);

  const fillOf = (share: number) => blendHex(c.accentText, c.surface, MIN_FILL + (1 - MIN_FILL) * share);
  const colorOf = (day: Day) => {
    if (day.sessions.length === 0) return undefined;
    return fillOf(maxVolume > 0 ? day.volume / maxVolume : 1);
  };

  const flat = weeks.flat();
  const chosen = selected != null ? flat.find((d) => d.time === selected) : undefined;
  const describe = (day: Day) => {
    const date = new Date(day.time).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    if (day.future) return `${date} · upcoming`;
    if (day.sessions.length === 0) return `${date} · ${day.today ? 'not trained yet' : 'rest day'}`;
    return `${date} · ${day.sessions.join(', ')}${day.volume > 0 ? ` · ${formatNumber(day.volume)} kg` : ''}`;
  };

  return (
    <View className="mx-4 mb-3 bg-surface rim border-edge rounded-md p-5">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-muted text-[9px] tracking-[3px]">CONSISTENCY</Text>
        <Text className="text-accent-text text-[10px] font-mono-bold">LAST {WEEKS} WEEKS</Text>
      </View>
      <Text className="text-primary text-xs h-5 mb-2" numberOfLines={1}>
        {chosen ? describe(chosen) : <Text className="text-muted">Tap a day to see its session</Text>}
      </Text>

      {/* Month names above the week each month starts in */}
      <View className="flex-row gap-[3px] ml-4 mb-1">
        {weeks.map((week, w) => {
          const month = new Date(week[0].time).getMonth();
          const first = w === 0 || new Date(weeks[w - 1][0].time).getMonth() !== month;
          return (
            <View key={week[0].time} className="flex-1 h-3">
              {first && (
                <Text className="text-muted text-[8px] absolute left-0" style={{ width: 32 }}>
                  {new Date(week[0].time).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View className="flex-row" accessibilityLabel={`${total} sessions in the last ${WEEKS} weeks`}>
        <View className="w-4 gap-[3px]">
          {DAY_LABELS.map((label, i) => (
            <View key={i} className="flex-1 justify-center">
              <Text className="text-muted text-[8px]">{label}</Text>
            </View>
          ))}
        </View>
        <View className="flex-1 flex-row gap-[3px]">
          {weeks.map((week) => (
            <View key={week[0].time} className="flex-1 gap-[3px]">
              {week.map((day) => {
                const color = colorOf(day);
                const isSelected = selected === day.time;
                return (
                  <Pressable
                    key={day.time}
                    onPress={() => setSelected(isSelected ? null : day.time)}
                    hitSlop={2}
                    accessibilityLabel={describe(day)}
                    className={`rounded-[4px] ${color || day.future ? '' : 'bg-elevated'}`}
                    style={{
                      aspectRatio: 1,
                      backgroundColor: color,
                      borderWidth: day.today || isSelected || day.future ? 1.5 : 0,
                      borderStyle: day.future && !isSelected ? 'dashed' : 'solid',
                      borderColor: isSelected ? c.primary : day.today ? c.accentText : c.elevated,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Scale: fill by the day's volume, up to the heaviest day shown */}
      <View className="flex-row items-center gap-1.5 mt-3 ml-4">
        <Text className="text-muted text-[9px] mr-1">Volume</Text>
        <View className="w-3 h-3 rounded-[3px] bg-elevated" />
        <Text className="text-muted text-[9px] mr-1">rest</Text>
        {LEGEND_STEPS.map((step) => (
          <View key={step} className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: fillOf(step) }} />
        ))}
        <Text className="text-muted text-[9px]">
          {maxVolume > 0 ? `up to ${formatNumber(maxVolume)} kg` : 'more'}
        </Text>
      </View>

      <View className="flex-row gap-2 mt-4">
        {([
          [perWeek.toFixed(1), 'PER WEEK', false],
          [String(weekStreak), 'WEEK STREAK', true],
          [String(total), total === 1 ? 'SESSION' : 'SESSIONS', false],
        ] as const).map(([value, label, accent]) => (
          <View key={label} className="flex-1 bg-elevated rounded-sm px-3 py-2">
            <Text className={`text-lg font-mono-bold ${accent ? 'text-accent-text' : 'text-primary'}`}>{value}</Text>
            <Text className="text-muted text-[8px] tracking-[1.5px]" numberOfLines={1}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
