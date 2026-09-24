import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard, formatDuration as formatSeconds, parseLocalDate, weekdayName } from '@/hooks/useDashboard';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useLibrary } from '@/hooks/useLibrary';
import { BarChart } from '@/components/charts/BarChart';
import { formatKg } from '@/utils/strength';
import { ExerciseTrend, formatDuration, formatNumber, formatSigned } from '@/utils/stats';

type WeeklyMetric = 'volume' | 'sessions' | 'minutes' | 'sets';

const WEEKLY_METRICS: { id: WeeklyMetric; label: string; format: (v: number) => string }[] = [
  { id: 'volume', label: 'VOLUME', format: (v) => `${formatNumber(Math.round(v))} kg` },
  { id: 'sessions', label: 'SESSIONS', format: (v) => `${+v.toFixed(1)} sessions` },
  { id: 'minutes', label: 'TIME', format: (v) => formatDuration(v) },
  { id: 'sets', label: 'SETS', format: (v) => `${+v.toFixed(1)} sets` },
];

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TRENDS_COLLAPSED = 5;

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, analytics, isLoading, isRefetching, refetch } = useDashboard();
  const { library } = useLibrary();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
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
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">OVERVIEW</Text>
        <Text className="text-primary text-[40px] font-bold leading-[42px] tracking-tighter">
          PERFORMANCE{'\n'}STATS
        </Text>
      </View>

      {/* Streak Card */}
      <View className="mx-4 mb-3 bg-surface rounded-md p-6">
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-muted text-[10px] tracking-[3px] mb-1">CURRENT STREAK</Text>
            <View className="flex-row items-end gap-2">
              <Text className="text-primary text-[64px] font-mono-bold leading-[68px] tracking-tighter">
                {stats.streak.current}
              </Text>
              <Text className="text-muted text-xs tracking-widest mb-2">DAYS</Text>
            </View>
          </View>
          <Ionicons name="flame" size={48} color={c.danger} />
        </View>

        {/* Week grid */}
        <View className="flex-row justify-between">
          {stats.streak.last7Days.map((day) => {
            const label = parseLocalDate(day.date).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0).toUpperCase();
            return (
              <View key={day.date} className="items-center gap-1">
                <Text className="text-muted text-[10px] tracking-widest">{label}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${day.trained ? 'bg-accent' : 'bg-elevated'}`}>
                  {day.trained && <Ionicons name="checkmark" size={12} color={c.accentFg} />}
                </View>
              </View>
            );
          })}
        </View>

        {stats.streak.longest > stats.streak.current && (
          <Text className="text-muted text-xs mt-4">Best: {stats.streak.longest} days</Text>
        )}
      </View>

      {/* Time Range Toggle */}
      <View className="flex-row mx-4 mb-3 bg-surface rounded-md p-1">
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            className={`flex-1 py-2.5 rounded-sm items-center ${timeRange === range ? 'bg-accent' : ''}`}
            onPress={() => setTimeRange(range)}
          >
            <Text className={`text-[11px] font-bold tracking-widest ${timeRange === range ? 'text-accent-fg' : 'text-muted'}`}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap mx-3 mb-3 gap-1">
        <View className="bg-surface rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="barbell-outline" size={20} color={c.accent} />
          <Text className="text-accent-text text-[28px] font-mono-bold tracking-tighter">{stats.sessions[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">SESSIONS</Text>
        </View>

        <View className="bg-elevated rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="fitness-outline" size={20} color={c.info} />
          <Text className="text-info text-[28px] font-mono-bold tracking-tighter">{stats.volume[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">KG VOLUME</Text>
        </View>

        <View className="bg-surface rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="time-outline" size={20} color={c.danger} />
          <Text className="text-danger text-[28px] font-mono-bold tracking-tighter">{formatSeconds(stats.durationSeconds[timeRange])}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">TIME TRAINED</Text>
        </View>

        <View className="bg-elevated rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="trending-up-outline" size={20} color={c.accent} />
          <Text className="text-accent-text text-[28px] font-mono-bold tracking-tighter">{stats.averageVolume[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">AVG / SESSION</Text>
        </View>
      </View>

      {/* Last Session */}
      {lastSession && (
        <TouchableOpacity
          className="mx-4 mb-3 bg-surface rounded-md p-5"
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
      <View className="mx-4 mb-3 bg-surface rounded-md p-5">
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

      {/* Lifetime numbers */}
      {lifetime.sessions > 0 && (
        <View className="mx-4 mb-3 bg-surface rounded-md p-5">
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
        <View className="mx-4 mb-3 bg-surface rounded-md p-5">
          <Text className="text-muted text-[9px] tracking-[3px] mb-1">STRENGTH TRENDS</Text>
          <Text className="text-muted text-[10px] mb-3">
            Best est. 1RM (reps or seconds for bodyweight and timed work) and its 90-day trend
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
        <View className="mx-4 mb-3 bg-surface rounded-md p-5">
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
        className="mx-4 mb-10 bg-surface rounded-md p-5 flex-row items-center gap-3"
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
