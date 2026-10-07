import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard, parseLocalDate, weekdayName } from '@/hooks/useDashboard';
import { useMemo, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';
import { useLibrary } from '@/hooks/useLibrary';
import { BarChart } from '@/components/charts/BarChart';
import { MuscleVolumeCard } from '@/components/MuscleVolumeCard';
import { formatKg } from '@/utils/strength';
import {
  ExerciseTrend, PeriodTotals, RecentRecord, StatsRange, formatDuration, formatNumber, formatSigned, summarizePeriods,
} from '@/utils/stats';
import { formatDaysAgo } from '@/utils/dates';

type WeeklyMetric = 'volume' | 'sessions' | 'minutes' | 'sets';

const WEEKLY_METRICS: { id: WeeklyMetric; label: string; format: (v: number) => string }[] = [
  { id: 'volume', label: 'VOLUME', format: (v) => `${formatNumber(Math.round(v))} kg` },
  { id: 'sessions', label: 'SESSIONS', format: (v) => `${+v.toFixed(1)} sessions` },
  { id: 'minutes', label: 'TIME', format: (v) => formatDuration(v) },
  { id: 'sets', label: 'SETS', format: (v) => `${+v.toFixed(1)} sets` },
];

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TRENDS_COLLAPSED = 5;
const RECORDS_SHOWN = 5;

/** Compact numbers for the tiles: 12.4k instead of 12,438. */
function formatCompact(value: number): string {
  if (value >= 10_000) return `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}k`;
  return formatNumber(Math.round(value));
}

/** "+1", "−8%", "+25m" against the previous period; null when there's nothing to compare with. */
function formatDelta(current: number, previous: number, kind: 'count' | 'percent' | 'minutes'): { text: string; up: boolean } | null {
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return { text: '±0', up: true };
  const sign = diff > 0 ? '+' : '−';
  if (kind === 'percent') {
    if (previous <= 0) return null;
    return { text: `${sign}${Math.round(Math.abs(diff / previous) * 100)}%`, up: diff > 0 };
  }
  if (kind === 'minutes') return { text: `${sign}${formatDuration(Math.abs(diff))}`, up: diff > 0 };
  return { text: `${sign}${Math.round(Math.abs(diff))}`, up: diff > 0 };
}

function describeRecord(r: RecentRecord): { value: string; gain: string } {
  const gain = r.value - r.previous;
  if (r.kind === 'weighted') return { value: `${formatKg(r.value)} kg`, gain: `+${formatKg(gain)} kg` };
  if (r.kind === 'timed') return { value: `${r.value} s`, gain: `+${gain} s` };
  return { value: `${r.value} reps`, gain: `+${gain}` };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, analytics, history, isLoading, isRefetching, refetch } = useDashboard();
  const { library } = useLibrary();
  const [timeRange, setTimeRange] = useState<StatsRange>('week');
  const [weeklyMetric, setWeeklyMetric] = useState<WeeklyMetric>('volume');
  const [showAllTrends, setShowAllTrends] = useState(false);
  const c = useTheme();

  const weekly = WEEKLY_METRICS.find((m) => m.id === weeklyMetric)!;
  const weeklyBars = analytics.weeks.map((w, i) => {
    const start = new Date(w.start);
    const end = new Date(w.start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const isCurrent = i === analytics.weeks.length - 1;
    return {
      label: `${start.getDate()}.${start.getMonth() + 1}`,
      value: w[weeklyMetric],
      detail: `${isCurrent ? 'THIS WEEK · ' : ''}${fmt(start)} – ${fmt(end)}`,
      partial: isCurrent,
    };
  });
  // The running week is incomplete, so the average covers the finished ones
  const finished = analytics.weeks.slice(0, -1);
  const weeklyAverage = finished.reduce((sum, w) => sum + w[weeklyMetric], 0) / (finished.length || 1);
  const { lifetime } = analytics;
  const period = useMemo(() => summarizePeriods(history, timeRange), [history, timeRange]);
  const tile = (key: keyof PeriodTotals) => ({
    values: period.recent.map((t) => t[key]),
    delta: formatDelta(period.current[key], period.previousToDate[key], key === 'volume' ? 'percent' : key === 'minutes' ? 'minutes' : 'count'),
  });
  const trends = showAllTrends ? analytics.trends : analytics.trends.slice(0, TRENDS_COLLAPSED);

  const openTrend = (t: ExerciseTrend) => {
    const entry = library.find((l) => l.id === t.libraryExerciseId);
    router.push({
      pathname: '/exercise-detail' as any,
      params: {
        libraryExerciseId: t.libraryExerciseId.toString(), fromLibrary: '1',
        exerciseName: entry?.name ?? t.name, description: entry?.description || '', videoUrl: entry?.videoUrl || '',
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const lastSession = stats.lastSession;

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerStyle={{ paddingBottom: 140 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
    >
      {/* Header, with the range switch beside it */}
      <View className="flex-row items-end justify-between px-5 pt-16 pb-4">
        <View>
          <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">OVERVIEW</Text>
          <Text className="text-primary text-[34px] font-bold tracking-tighter leading-9">Stats</Text>
        </View>
        <View className="flex-row gap-1.5">
          {(['week', 'month', 'year'] as const).map((range) => (
            <Tactile
              key={range}
              variant={timeRange === range ? 'accent' : 'elevated'}
              depth={3}
              className="h-9 px-3 rounded-sm justify-center"
              onPress={() => setTimeRange(range)}
              accessibilityLabel={`Show this ${range}`}
              accessibilityState={{ selected: timeRange === range }}
            >
              <Text className={`text-[11px] font-bold tracking-widest ${timeRange === range ? 'text-accent-fg' : 'text-muted'}`}>
                {range.toUpperCase()}
              </Text>
            </Tactile>
          ))}
        </View>
      </View>

      {/* Streak in one row */}
      <View className="mx-4 mb-2 bg-surface border-2 border-edge border-b-[6px] rounded-md px-4 py-3.5 flex-row items-center gap-3">
        <Ionicons name="flame" size={26} color={stats.streak.current > 0 ? c.danger : c.subtle} />
        <View className="flex-1">
          <Text className="text-primary text-lg font-bold">
            <Text className="font-mono-bold">{stats.streak.current}</Text> day streak
          </Text>
          <Text className="text-muted text-xs">
            {stats.streak.longest > stats.streak.current ? `Best ${stats.streak.longest} days` : stats.streak.current > 0 ? 'Your best yet' : 'Train today to start one'}
          </Text>
        </View>
        <View className="flex-row gap-1">
          {stats.streak.last7Days.map((day) => (
            <View
              key={day.date}
              className={`w-1.5 h-6 rounded-full ${day.trained ? 'bg-danger' : 'bg-elevated'}`}
              accessibilityLabel={`${parseLocalDate(day.date).toLocaleDateString(undefined, { weekday: 'long' })}${day.trained ? ', trained' : ''}`}
            />
          ))}
        </View>
      </View>

      {/* Tiles: this period, against the previous one up to the same point */}
      <View className="mx-4 mb-1 gap-2">
        <View className="flex-row gap-2">
          <StatTile label="SESSIONS" textClass="text-accent-text" barClass="bg-accent" value={String(period.current.sessions)} {...tile('sessions')} />
          <StatTile label="VOLUME · KG" textClass="text-info" barClass="bg-info" value={formatCompact(period.current.volume)} {...tile('volume')} />
        </View>
        <View className="flex-row gap-2">
          <StatTile label="TIME TRAINED" textClass="text-danger" barClass="bg-danger" value={formatDuration(period.current.minutes)} {...tile('minutes')} />
          <StatTile label="SETS" textClass="text-primary" barClass="bg-primary" value={String(period.current.sets)} {...tile('sets')} />
        </View>
      </View>
      <Text className="text-muted text-[10px] mx-5 mb-3">Changes compare with last {timeRange} up to the same point.</Text>

      {/* Records from the last 30 days */}
      {analytics.recentRecords.length > 0 && (
        <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5 gap-3">
          <Text className="text-muted text-[9px] tracking-[3px]">NEW RECORDS · LAST 30 DAYS</Text>
          {analytics.recentRecords.slice(0, RECORDS_SHOWN).map((record) => {
            const { value, gain } = describeRecord(record);
            const trend = analytics.trends.find((t) => t.libraryExerciseId === record.libraryExerciseId);
            return (
              <TouchableOpacity
                key={record.libraryExerciseId}
                className="flex-row items-center gap-3"
                onPress={() => trend && openTrend(trend)}
                disabled={!trend}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-sm bg-accent-muted justify-center items-center">
                  <Ionicons name="trophy-outline" size={16} color={c.accent} />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-sm font-bold" numberOfLines={1}>{record.name}</Text>
                  <Text className="text-muted text-[11px]">{formatDaysAgo(record.date)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-primary text-sm font-mono-bold">{value}</Text>
                  <Text className="text-accent-text text-[11px]">{gain}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Last Session */}
      {lastSession && (
        <TouchableOpacity
          className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5"
          onPress={() =>
            router.push({ pathname: '/history-detail', params: { trainingLogId: lastSession.id.toString() } })
          }
          activeOpacity={0.85}
        >
          <Text className="text-muted text-[9px] tracking-[3px] mb-3">LAST SESSION</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-primary text-xl font-bold tracking-tight mb-1">
                {lastSession.workoutName || lastSession.splitName}
              </Text>
              <Text className="text-muted text-xs">
                {new Date(lastSession.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long', day: 'numeric', month: 'long',
                })} · {lastSession.exerciseCount} exercises
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.muted} />
          </View>
        </TouchableOpacity>
      )}

      {/* Weekly trend */}
      <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-muted text-[9px] tracking-[3px]">LAST 12 WEEKS</Text>
          {weeklyMetric === 'volume' && analytics.volumeChangePct != null && (
            <Text className={`text-[10px] font-mono-bold ${analytics.volumeChangePct >= 0 ? 'text-accent-text' : 'text-danger'}`}>
              {formatSigned(analytics.volumeChangePct, 0, '%')} 4 WKS VS PRIOR 4
            </Text>
          )}
        </View>
        <View className="flex-row gap-1 mb-4 flex-wrap">
          {WEEKLY_METRICS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setWeeklyMetric(m.id)}
              className={`px-3 py-1.5 rounded-sm ${m.id === weeklyMetric ? 'bg-accent' : 'bg-elevated'}`}
              activeOpacity={0.85}
            >
              <Text className={`text-[10px] font-bold tracking-widest ${m.id === weeklyMetric ? 'text-accent-fg' : 'text-muted'}`}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <BarChart
          bars={weeklyBars}
          formatValue={weekly.format}
          labelEvery={2}
          reference={{ value: weeklyAverage, label: '11-WEEK AVG' }}
        />
        <Text className="text-muted text-[10px] mt-2">Touch and drag across the bars to inspect a week</Text>
      </View>

      {lifetime.sessions > 0 && <MuscleVolumeCard logs={history} library={library} />}

      {/* Lifetime numbers */}
      {lifetime.sessions > 0 && (
        <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5">
          <Text className="text-muted text-[9px] tracking-[3px] mb-4">
            BY THE NUMBERS{lifetime.firstDate
              ? ` · SINCE ${new Date(lifetime.firstDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}`
              : ''}
          </Text>
          <View className="flex-row flex-wrap gap-y-4">
            <NumberCell value={formatNumber(lifetime.sessions)} label="SESSIONS" />
            <NumberCell value={formatNumber(lifetime.volume)} label="KG LIFTED" accent />
            <NumberCell value={formatDuration(lifetime.minutes)} label="TIME TRAINED" />
            <NumberCell value={formatNumber(lifetime.sets)} label="SETS" />
            <NumberCell value={formatNumber(lifetime.reps)} label="REPS" />
            <NumberCell value={String(lifetime.exercisesTrained)} label="EXERCISES" />
            <NumberCell value={formatDuration(lifetime.avgMinutes)} label="AVG SESSION" />
            <NumberCell value={formatNumber(lifetime.avgVolume)} label="AVG KG / SESSION" />
            <NumberCell value={lifetime.avgSets.toFixed(1)} label="AVG SETS / SESSION" />
            <NumberCell value={analytics.sessionsPerWeek.toFixed(1)} label="SESSIONS / WK (12W)" />
            <NumberCell value={lifetime.avgExercises.toFixed(1)} label="EXERCISES / SESSION" />
            <NumberCell value={String(analytics.prsLast30Days)} label="PRS · LAST 30 DAYS" accent />
          </View>
        </View>
      )}

      {/* Strength trends */}
      {analytics.trends.length > 0 && (
        <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5">
          <Text className="text-muted text-[9px] tracking-[3px] mb-1">STRENGTH TRENDS</Text>
          <Text className="text-muted text-[10px] mb-3">
            Top weight (reps or seconds for bodyweight and timed work) and its 90-day trend
          </Text>
          {trends.map((t) => {
            const p = t.progression;
            const unit = t.kind === 'weighted' ? ' kg' : t.kind === 'timed' ? ' s' : ' reps';
            const tone = !p ? 'text-muted' : p.pctPerMonth > 0 ? 'text-accent-text' : p.pctPerMonth < 0 ? 'text-danger' : 'text-primary';
            return (
              <TouchableOpacity
                key={t.libraryExerciseId}
                className="flex-row items-center py-2.5 gap-3"
                onPress={() => openTrend(t)}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text className="text-primary text-sm font-bold" numberOfLines={1}>{t.name}</Text>
                  <Text className="text-muted text-[10px]">
                    {formatKg(Math.round(t.best * 10) / 10)}{unit} best · {t.sessions} sessions
                  </Text>
                </View>
                <View className="items-end">
                  <Text className={`text-sm font-mono-bold ${tone}`}>{p ? formatSigned(p.pctPerMonth, 1, '%') : '—'}</Text>
                  <Text className="text-muted text-[9px] tracking-[1px]">{p ? 'PER MONTH' : 'NEEDS 3+ SESSIONS'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.muted} />
              </TouchableOpacity>
            );
          })}
          {analytics.trends.length > TRENDS_COLLAPSED && (
            <TouchableOpacity onPress={() => setShowAllTrends(!showAllTrends)} className="pt-2 items-center">
              <Text className="text-accent-text text-[10px] font-bold tracking-[2px]">
                {showAllTrends ? 'SHOW LESS' : `SHOW ALL ${analytics.trends.length}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Weekday distribution */}
      {lifetime.sessions > 0 && (
        <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5">
          <Text className="text-muted text-[9px] tracking-[3px] mb-3">
            SESSIONS BY WEEKDAY{stats.mostActiveDay ? ` · MOST ACTIVE: ${weekdayName(stats.mostActiveDay).toUpperCase()}` : ''}
          </Text>
          <BarChart
            bars={analytics.weekdayCounts.map((count, i) => ({
              label: WEEKDAYS[i].charAt(0),
              value: count,
              detail: `${WEEKDAYS[i]} · ${Math.round((count / lifetime.sessions) * 100)}% OF SESSIONS`,
            }))}
            formatValue={(v) => `${v} sessions`}
            defaultIndex={analytics.weekdayCounts.indexOf(Math.max(...analytics.weekdayCounts))}
            height={120}
          />
        </View>
      )}

      {/* Tools */}
      <TouchableOpacity
        className="mx-4 mb-10 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5 flex-row items-center gap-3"
        onPress={() => router.push('/one-rep-max' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="calculator-outline" size={22} color={c.accent} />
        <View className="flex-1">
          <Text className="text-primary text-sm font-bold">1RM Calculator</Text>
          <Text className="text-muted text-[11px]">7 formulas, rep maxes and loadable weights</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.muted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function NumberCell({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={{ width: '33.33%' }} className="pr-2">
      <Text
        className={`${accent ? 'text-accent-text' : 'text-primary'} text-lg font-mono-bold tracking-tight`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text className="text-muted text-[8px] tracking-[1.5px] mt-0.5">{label}</Text>
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  textClass: string;
  barClass: string;
  /** Recent periods, oldest first; the last is the running one. */
  values: number[];
  delta: { text: string; up: boolean } | null;
}

/** One of the equal-sized tiles in the stats grid: value, change and a small trend. */
function StatTile({ label, value, textClass, barClass, values, delta }: StatTileProps) {
  const max = Math.max(...values, 1);
  return (
    <View className="flex-1 bg-surface border-2 border-edge border-b-[6px] rounded-md px-4 py-3.5 gap-1">
      <Text className="text-muted text-[9px] tracking-[2px]" numberOfLines={1}>{label}</Text>
      <Text className={`${textClass} text-[28px] font-mono-bold tracking-tighter`} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View className="flex-row items-end justify-between">
        <Text className={`text-[11px] ${delta?.up ? 'text-accent-text' : 'text-muted'}`}>{delta ? delta.text : '—'}</Text>
        <View className="flex-row items-end gap-0.5 h-5" accessible={false}>
          {values.map((v, i) => (
            <View
              key={i}
              className={`w-1 rounded-sm ${i === values.length - 1 ? barClass : 'bg-elevated'}`}
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
