import { View, Text, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ExerciseProgressEntry } from '@/types';
import { formatKg } from '@/utils/strength';
import {
  ExerciseStats, SessionPoint, computeExerciseStats, formatNumber, formatSigned, formatWeeks,
} from '@/utils/stats';
import { TrendChart, TrendPoint } from '@/components/charts/TrendChart';

interface Props {
  entries: ExerciseProgressEntry[];
  timed: boolean;
}

type Metric = 'e1rm' | 'weight' | 'volume' | 'reps' | 'totalReps';

const METRICS: Record<ExerciseStats['kind'], { id: Metric; label: string }[]> = {
  weighted: [
    { id: 'e1rm', label: 'EST. 1RM' },
    { id: 'weight', label: 'WEIGHT' },
    { id: 'volume', label: 'VOLUME' },
    { id: 'reps', label: 'REPS' },
  ],
  bodyweight: [
    { id: 'reps', label: 'REPS / SET' },
    { id: 'totalReps', label: 'TOTAL REPS' },
  ],
  timed: [
    { id: 'reps', label: 'SEC / SET' },
    { id: 'totalReps', label: 'TOTAL SEC' },
  ],
};

const RANGES = [
  { id: '3m', label: '3M', days: 91 },
  { id: '6m', label: '6M', days: 182 },
  { id: '1y', label: '1Y', days: 365 },
  { id: 'all', label: 'ALL', days: Infinity },
] as const;

const DAY_MS = 86_400_000;

function metricValue(p: SessionPoint, m: Metric): number {
  switch (m) {
    case 'e1rm': return p.e1rm;
    case 'weight': return p.weight;
    case 'volume': return p.volume;
    case 'reps': return p.reps;
    case 'totalReps': return p.totalReps;
  }
}

const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const longDate = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function ExerciseAnalytics({ entries, timed }: Props) {
  const c = useTheme();
  const stats = useMemo(() => computeExerciseStats(entries, timed), [entries, timed]);
  const [metric, setMetric] = useState<Metric | null>(null);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('all');

  if (!stats) {
    return (
      <View className="bg-surface rounded-md p-5 mb-2 items-center py-8 gap-2">
        <Ionicons name="analytics-outline" size={36} color={c.muted} />
        <Text className="text-muted text-sm font-bold tracking-widest">NO DATA YET</Text>
        <Text className="text-muted text-[11px] text-center">Complete a session with this exercise to unlock its stats</Text>
      </View>
    );
  }

  const { kind, points, progression } = stats;
  const metrics = METRICS[kind];
  const activeMetric = metric ?? metrics[0].id;
  const unit = kind === 'weighted' ? 'kg' : kind === 'timed' ? 's' : 'reps';
  const primaryUnit = kind === 'weighted' ? 'kg' : kind === 'timed' ? 's' : ' reps';
  const fmt = (v: number, u = primaryUnit) => `${formatKg(Math.round(v * 10) / 10)}${u.startsWith(' ') ? u : ` ${u}`}`;

  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const lastDate = points[points.length - 1].date;
  const visible = points.filter((p) => lastDate - p.date <= rangeDays * DAY_MS && metricValue(p, activeMetric) > 0);
  const chartPoints: TrendPoint[] = visible.map((p) => ({ x: p.date, y: metricValue(p, activeMetric) }));
  // The projection follows the primary metric, which is always the first option
  const showProjection = progression && activeMetric === metrics[0].id && chartPoints.length > 1;
  const projection: TrendPoint[] = showProjection
    ? [
        { x: progression.lastDate, y: progression.trendValue },
        ...progression.projections.map((p) => ({ x: progression.lastDate + p.weeks * 7 * DAY_MS, y: p.value })),
      ]
    : [];

  const metricUnit = activeMetric === 'volume' || activeMetric === 'weight' || activeMetric === 'e1rm' ? ' kg' : kind === 'timed' ? ' s' : ' reps';
  const describe = (i: number) => {
    const p = visible[i];
    const set = `${p.sets}×${p.reps}${kind === 'timed' ? 's' : ''}`;
    return p.weight > 0 ? `${formatKg(p.weight)} kg × ${set}` : set;
  };

  const sincePr = stats.sincePr;

  return (
    <>
      {/* Chart */}
      <View className="bg-surface rounded-md p-5 mb-2">
        <Text className="text-muted text-[9px] tracking-[3px] mb-3">PROGRESS</Text>
        <View className="flex-row gap-1 mb-3 flex-wrap">
          {metrics.map((m) => (
            <Chip key={m.id} label={m.label} active={m.id === activeMetric} onPress={() => setMetric(m.id)} />
          ))}
        </View>

        {chartPoints.length === 0 ? (
          <Text className="text-muted text-xs text-center py-10">No sessions in this range</Text>
        ) : (
          <TrendChart
            points={chartPoints}
            projection={projection}
            formatValue={(v) => {
              const r = Math.round(v * 10) / 10;
              return `${formatNumber(r, Number.isInteger(r) ? 0 : 1)}${metricUnit}`;
            }}
            formatX={shortDate}
            describe={describe}
          />
        )}

        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-muted text-[10px]">
            {showProjection ? 'Dashed: 12-week trend projection' : 'Touch and drag to inspect'}
          </Text>
          <View className="flex-row gap-1">
            {RANGES.map((r) => (
              <Chip key={r.id} label={r.label} active={r.id === range} onPress={() => setRange(r.id)} small />
            ))}
          </View>
        </View>
      </View>

      {/* Numbers */}
      <View className="bg-surface rounded-md p-5 mb-2">
        <Text className="text-muted text-[9px] tracking-[3px] mb-3">
          {kind === 'weighted' ? 'ESTIMATED 1RM' : kind === 'timed' ? 'BEST HOLD' : 'BEST SET'}
        </Text>
        <View className="flex-row flex-wrap gap-y-4">
          <Stat value={fmt(stats.best)} label="ALL-TIME BEST" accent />
          <Stat value={fmt(stats.latest)} label="LATEST" />
          <Stat
            value={stats.changePct != null ? formatSigned(stats.changePct, 1, '%') : formatSigned(stats.change, 1)}
            label="SINCE FIRST"
            tone={stats.change > 0 ? 'up' : stats.change < 0 ? 'down' : undefined}
          />
          <Stat value={stats.latestIntensity != null ? `${Math.round(stats.latestIntensity)}%` : '—'} label="LATEST / BEST" />
          <Stat value={String(stats.sessions)} label="SESSIONS" />
          <Stat value={stats.sessionsPerWeek ? stats.sessionsPerWeek.toFixed(1) : '—'} label="SESSIONS / WEEK" />
          {kind === 'weighted' && <Stat value={`${formatNumber(stats.totalVolume)} kg`} label="TOTAL VOLUME" />}
          <Stat value={formatNumber(stats.totalReps)} label={kind === 'timed' ? 'TOTAL SECONDS' : 'TOTAL REPS'} />
          <Stat value={formatNumber(stats.totalSets)} label="TOTAL SETS" />
          {sincePr && (
            <Stat
              value={sincePr.sessions === 0 ? 'NOW' : `${sincePr.sessions}`}
              label={sincePr.sessions === 0 ? 'LATEST IS A PR' : `SESSIONS SINCE PR · ${sincePr.days}D`}
              tone={sincePr.sessions >= 4 ? 'down' : undefined}
            />
          )}
        </View>
      </View>

      {/* Progression model */}
      <View className="bg-surface rounded-md p-5 mb-2">
        <Text className="text-muted text-[9px] tracking-[3px] mb-3">PROGRESSION TREND</Text>
        {!progression ? (
          <Text className="text-muted text-xs">
            Needs at least 3 sessions spread over a week or more. {Math.max(0, 3 - stats.sessions) > 0
              ? `${3 - stats.sessions} more to go.` : ''}
          </Text>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-y-4 mb-4">
              <Stat
                value={`${formatSigned(progression.perWeek, kind === 'weighted' ? 2 : 1)}${unit === 'reps' ? '' : ` ${unit}`}`}
                label={`PER WEEK${unit === 'reps' ? ' (REPS)' : ''}`}
                tone={progression.perWeek > 0 ? 'up' : progression.perWeek < 0 ? 'down' : undefined}
              />
              <Stat
                value={formatSigned(progression.pctPerMonth, 1, '%')}
                label="PER MONTH"
                tone={progression.pctPerMonth > 0 ? 'up' : progression.pctPerMonth < 0 ? 'down' : undefined}
              />
              <Stat value={progression.r2.toFixed(2)} label={`R² · ${progression.confidence.toUpperCase()} FIT`} />
            </View>

            <Text className="text-muted text-[9px] tracking-[2px] mb-2">IF THE TREND HOLDS</Text>
            <View className="flex-row bg-base rounded-sm mb-3">
              <View className="flex-1 items-center py-3">
                <Text className="text-primary text-sm font-mono-bold">{fmt(progression.trendValue)}</Text>
                <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">TREND NOW</Text>
              </View>
              {progression.projections.map((p) => (
                <View key={p.weeks} className="flex-1 items-center py-3">
                  <Text className="text-accent-text text-sm font-mono-bold">{fmt(p.value)}</Text>
                  <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">+{p.weeks} WEEKS</Text>
                </View>
              ))}
            </View>

            {progression.milestone && (
              <View className="flex-row items-center gap-2 mb-3">
                <Ionicons name="flag-outline" size={16} color={c.accent} />
                <Text className="text-primary text-xs flex-1">
                  Next milestone <Text className="font-mono-bold">{fmt(progression.milestone.target)}</Text>
                  {progression.milestone.weeks != null
                    ? ` in ${formatWeeks(progression.milestone.weeks)}`
                    : ': trend is flat or falling, no ETA'}
                </Text>
              </View>
            )}

            <Text className="text-muted text-[10px] leading-4">
              Least-squares fit over {progression.sessions} sessions in the last {Math.round(progression.windowDays)} days
              {progression.confidence === 'low' ? '. Low R²: sessions vary a lot, so treat the projection as a rough guide.' : '.'}
            </Text>
          </>
        )}
      </View>

      {/* Record sets */}
      <View className="bg-surface rounded-md p-5 mb-2">
        <Text className="text-muted text-[9px] tracking-[3px] mb-2">RECORD SESSIONS</Text>
        {stats.bestE1rm && <RecordRow label="Best est. 1RM" value={fmt(stats.bestE1rm.e1rm)} point={stats.bestE1rm} kind={kind} />}
        {stats.bestWeight && <RecordRow label="Heaviest weight" value={fmt(stats.bestWeight.weight)} point={stats.bestWeight} kind={kind} />}
        {stats.bestVolume && <RecordRow label="Most volume" value={`${formatNumber(stats.bestVolume.volume)} kg`} point={stats.bestVolume} kind={kind} />}
        {stats.bestReps && (
          <RecordRow
            label={kind === 'timed' ? 'Longest hold' : 'Most reps per set'}
            value={`${stats.bestReps.reps}${kind === 'timed' ? ' s' : ''}`}
            point={stats.bestReps}
            kind={kind}
          />
        )}
      </View>
    </>
  );
}

function Chip({ label, active, onPress, small }: { label: string; active: boolean; onPress: () => void; small?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`${small ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-sm ${active ? 'bg-accent' : 'bg-elevated'}`}
      activeOpacity={0.85}
    >
      <Text className={`text-[10px] font-bold tracking-widest ${active ? 'text-accent-fg' : 'text-muted'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label, accent, tone }: { value: string; label: string; accent?: boolean; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-accent-text' : tone === 'down' ? 'text-danger' : accent ? 'text-accent-text' : 'text-primary';
  return (
    <View style={{ width: '50%' }} className="pr-2">
      <Text className={`${color} text-xl font-mono-bold tracking-tight`}>{value}</Text>
      <Text className="text-muted text-[8px] tracking-[2px] mt-0.5">{label}</Text>
    </View>
  );
}

function RecordRow({ label, value, point, kind }: { label: string; value: string; point: SessionPoint; kind: ExerciseStats['kind'] }) {
  const set = `${point.sets}×${point.reps}${kind === 'timed' ? 's' : ''}`;
  return (
    <View className="flex-row items-center py-2 gap-3">
      <View className="flex-1">
        <Text className="text-primary text-sm">{label}</Text>
        <Text className="text-muted text-[10px]">
          {longDate(point.date)} · {point.weight > 0 ? `${formatKg(point.weight)} kg × ` : ''}{set}
        </Text>
      </View>
      <Text className="text-accent-text text-base font-mono-bold">{value}</Text>
    </View>
  );
}
