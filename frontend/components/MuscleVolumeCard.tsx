import { View, Text, TouchableOpacity } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LibraryExercise, Muscle, TrainingLog } from '@/types';
import { MAJOR_MUSCLES, MUSCLE_LABELS, MUSCLES, WEEKLY_SET_TARGET } from '@/constants/muscles';
import { computeMuscleVolume } from '@/utils/muscles';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';
import { BodyMap, MuscleFills } from '@/components/BodyMap';
import { blendHex } from '@/utils/color';

type Range = 'week' | 'average';

// The running week plus the four finished ones the average covers
const WEEK_COUNT = 5;

const formatSets = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/**
 * Working sets per muscle against the weekly target range, for the running week or the
 * average of the last four finished weeks.
 */
export function MuscleVolumeCard({ logs, library }: { logs: TrainingLog[]; library: LibraryExercise[] }) {
  const router = useRouter();
  const c = useTheme();
  const [range, setRange] = useState<Range>('week');
  const [selected, setSelected] = useState<Muscle | null>(null);
  const volume = useMemo(() => computeMuscleVolume(logs, library, WEEK_COUNT), [logs, library]);

  const current = volume.weeks[volume.weeks.length - 1];
  const finished = volume.weeks.slice(0, -1);
  const setsFor = (muscle: Muscle) =>
    range === 'week'
      ? current.sets[muscle] ?? 0
      : finished.reduce((sum, w) => sum + (w.sets[muscle] ?? 0), 0) / finished.length;
  const untaggedSets = range === 'week'
    ? current.untaggedSets
    : finished.reduce((sum, w) => sum + w.untaggedSets, 0) / finished.length;
  const untaggedExercises = range === 'week'
    ? current.untaggedIds.size
    : new Set(finished.flatMap((w) => [...w.untaggedIds])).size;

  const rows = MUSCLES
    .map((muscle) => ({ muscle, sets: setsFor(muscle) }))
    .filter((r) => MAJOR_MUSCLES.has(r.muscle) || r.sets > 0);
  // Leave room past the target so a muscle above it is visibly longer
  const scale = Math.max(WEEKLY_SET_TARGET.max * 1.25, ...rows.map((r) => r.sets));
  const pct = (v: number) => `${(v / scale) * 100}%` as const;
  const inTarget = rows.filter((r) => r.sets >= WEEKLY_SET_TARGET.min).length;
  const hasTagged = library.some((e) => e.muscles?.length);

  // Below the target the accent fades in with the sets, above it the muscle turns blue like its bar
  const heatOf = (sets: number) =>
    sets < WEEKLY_SET_TARGET.min
      ? blendHex(c.accentText, c.surface, 0.2 + 0.5 * (sets / WEEKLY_SET_TARGET.min))
      : sets <= WEEKLY_SET_TARGET.max ? c.accentText : c.info;
  const fills: MuscleFills = Object.fromEntries(
    MUSCLES.filter((m) => setsFor(m) > 0).map((m) => [m, heatOf(setsFor(m))]),
  );
  const selectedSets = selected ? Math.round(setsFor(selected) * 10) / 10 : 0;

  return (
    <View className="mx-4 mb-3 bg-surface border-2 border-edge border-b-[6px] rounded-md p-5">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-muted text-[9px] tracking-[3px]">WEEKLY SETS PER MUSCLE</Text>
        <Text className="text-accent-text text-[10px] font-mono-bold">
          {inTarget}/{rows.length} AT {WEEKLY_SET_TARGET.min}+
        </Text>
      </View>
      <Text className="text-muted text-[10px] mb-3">
        Target {WEEKLY_SET_TARGET.min}–{WEEKLY_SET_TARGET.max} working sets. Secondary muscles count half.
      </Text>

      <View className="flex-row gap-1 mb-4">
        {([['week', 'THIS WEEK'], ['average', '4-WEEK AVG']] as const).map(([id, label]) => (
          <Tactile
            key={id}
            variant={range === id ? 'accent' : 'elevated'}
            depth={3}
            className="px-3 py-1.5 rounded-sm"
            onPress={() => setRange(id)}
            accessibilityState={{ selected: range === id }}
          >
            <Text className={`text-[10px] font-bold tracking-widest ${range === id ? 'text-accent-fg' : 'text-muted'}`}>
              {label}
            </Text>
          </Tactile>
        ))}
      </View>

      <BodyMap
        fills={fills}
        height={190}
        onPressMuscle={(m) => setSelected((current) => (current === m ? null : m))}
        accessibilityLabel={`Weekly sets per muscle: ${rows.filter((r) => r.sets > 0).map((r) => `${MUSCLE_LABELS[r.muscle]} ${formatSets(Math.round(r.sets * 10) / 10)}`).join(', ') || 'none yet'}`}
      />
      <View className="h-8 justify-center items-center mb-2">
        {selected ? (
          <Text className="text-primary text-xs">
            <Text className="font-bold">{MUSCLE_LABELS[selected]}</Text>
            <Text className="text-muted"> · </Text>
            <Text className="font-mono-bold">{formatSets(selectedSets)}</Text>
            <Text className="text-muted"> {selectedSets === 1 ? 'set' : 'sets'}</Text>
          </Text>
        ) : (
          <View className="flex-row items-center gap-4">
            {([
              ['UNDER', blendHex(c.accentText, c.surface, 0.45)],
              ['IN RANGE', c.accentText],
              ['OVER', c.info],
            ] as const).map(([label, color]) => (
              <View key={label} className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                <Text className="text-muted text-[8px] tracking-[2px]">{label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {rows.map(({ muscle, sets }) => {
        const tone = sets < WEEKLY_SET_TARGET.min ? 'bg-subtle' : sets <= WEEKLY_SET_TARGET.max ? 'bg-accent' : 'bg-info';
        return (
          <View key={muscle} className={`flex-row items-center gap-3 py-1.5 px-1.5 -mx-1.5 rounded-sm ${selected === muscle ? 'bg-elevated' : ''}`}>
            <Text className="text-primary text-xs w-24" numberOfLines={1}>{MUSCLE_LABELS[muscle]}</Text>
            <View className="flex-1 h-2.5 bg-elevated rounded-full overflow-hidden">
              <View
                className="absolute h-full bg-accent-muted"
                style={{ left: pct(WEEKLY_SET_TARGET.min), width: pct(WEEKLY_SET_TARGET.max - WEEKLY_SET_TARGET.min) }}
              />
              {sets > 0 && <View className={`absolute h-full rounded-full ${tone}`} style={{ width: pct(sets) }} />}
            </View>
            <Text className={`text-xs font-mono-bold w-9 text-right ${sets > 0 ? 'text-primary' : 'text-subtle'}`}>
              {formatSets(Math.round(sets * 10) / 10)}
            </Text>
          </View>
        );
      })}

      {(untaggedSets > 0 || !hasTagged) && (
        <TouchableOpacity
          className="flex-row items-center gap-2 mt-3 pt-3 border-t border-elevated"
          onPress={() => router.push('/assign-muscles' as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="body-outline" size={16} color={c.accent} />
          <Text className="flex-1 text-muted text-[11px]">
            {untaggedSets > 0
              ? `${formatSets(Math.round(untaggedSets * 10) / 10)} ${range === 'week' ? 'sets this week' : 'sets a week'} from ${
                untaggedExercises === 1 ? 'an exercise' : 'exercises'} without muscles aren't counted`
              : 'Assign muscles to your exercises to track volume'}
          </Text>
          <Text className="text-accent-text text-[10px] font-bold tracking-[2px]">ASSIGN</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
