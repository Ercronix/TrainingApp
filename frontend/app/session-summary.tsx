import { Animated, Platform, ScrollView, Text, View } from 'react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/hooks/useDashboard';
import { Tactile } from '@/components/Tactile';
import { BodyMap, targetFills } from '@/components/BodyMap';
import { useLibrary } from '@/hooks/useLibrary';
import { combineMuscles, muscleNames } from '@/utils/muscles';
import { EASE_OUT, spring } from '@/constants/motion';
import { formatSets, previousSetsOf, setsOf, summarizeSets, workingSets } from '@/utils/sets';
import { personalRecordOf } from '@/utils/strength';
import { formatNumber, formatSigned, totalsOf } from '@/utils/stats';
import { ExerciseLog } from '@/types';

const useNativeDriver = Platform.OS !== 'web';
// Sparks around the medal when the session set a record
const SPARKS = 10;
const SPARK_DISTANCE = 80;

/** Fades and slides a section in, `order` steps after the medal. */
function Appear({ order, reduceMotion, children }: { order: number; reduceMotion: boolean | null; children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion == null) return;
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1, duration: 420, delay: 180 + Math.min(order, 8) * 70, easing: EASE_OUT, useNativeDriver,
    }).start();
  }, [order, reduceMotion, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  return <Animated.View style={{ opacity: progress, transform: [{ translateY }] }}>{children}</Animated.View>;
}

/** The medal on top: pops in with a bounce, and throws sparks for a record. */
function Medal({ record, reduceMotion }: { record: boolean; reduceMotion: boolean | null }) {
  const c = useTheme();
  const scale = useRef(new Animated.Value(0.3)).current;
  const burst = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion == null) return;
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, { toValue: 1, ...spring(0.5, 0.5), useNativeDriver }).start();
    if (record) Animated.timing(burst, { toValue: 1, duration: 800, delay: 120, easing: EASE_OUT, useNativeDriver }).start();
  }, [record, reduceMotion, scale, burst]);

  return (
    <View className="w-24 h-24 justify-center items-center" accessible={false}>
      {record && Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * 2 * Math.PI;
        const distance = burst.interpolate({ inputRange: [0, 1], outputRange: [0, SPARK_DISTANCE] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: i % 2 ? c.info : c.accent,
              opacity: burst.interpolate({ inputRange: [0, 0.1, 0.6, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: Animated.multiply(distance, Math.cos(angle)) },
                { translateY: Animated.multiply(distance, Math.sin(angle)) },
              ],
            }}
          />
        );
      })}
      <Animated.View style={{ transform: [{ scale }] }}>
        {/* Raised on its lip, or ringed by a soft halo of the accent in a glass theme */}
        <View className="rounded-full" style={c.glass ? { padding: 6, margin: -6, backgroundColor: `${c.accent}40` } : undefined}>
          <View className={`w-20 h-20 rounded-full bg-accent justify-center items-center ${c.glass ? '' : 'border-b-[6px] border-accent-lip'}`}>
            <Ionicons name={record ? 'trophy' : 'checkmark-done'} size={34} color={c.accentFg} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center px-1">
      <Text className="text-primary text-[22px] font-mono-bold tracking-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-muted text-[8px] tracking-[2px]">{label}</Text>
    </View>
  );
}

interface TopSetDelta {
  value: number;
  unit: 'kg' | 'reps' | 's';
}

/**
 * The top working set against the exercise's last session: heavier or lighter first, and at the
 * same weight more or fewer reps (or seconds). Unlike total volume it isn't swayed by doing one set
 * more or less, and it works for bodyweight exercises too.
 */
function topSetDelta(log: ExerciseLog): TopSetDelta | null {
  const previous = previousSetsOf(log);
  const current = setsOf(log);
  if (workingSets(previous).length === 0 || workingSets(current).length === 0) return null;
  const before = summarizeSets(previous);
  const now = summarizeSets(current);
  const kg = Math.round((Number(now.weightUsed ?? 0) - Number(before.weightUsed ?? 0)) * 100) / 100;
  if (kg !== 0) return { value: kg, unit: 'kg' };
  const reps = now.repsCompleted - before.repsCompleted;
  return reps !== 0 ? { value: reps, unit: log.repUnit === 'seconds' ? 's' : 'reps' } : null;
}

const describeDelta = ({ value, unit }: TopSetDelta) =>
  unit === 'kg'
    ? `${formatSigned(value, Number.isInteger(value) ? 0 : 1)} kg`
    : unit === 's' ? `${formatSigned(value, 0)} s` : `${formatSigned(value, 0)} ${Math.abs(value) === 1 ? 'rep' : 'reps'}`;

/** Shown right after finishing a session: what was done, and the records it set. */
export default function SessionSummaryScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const c = useTheme();
  const isOnline = useIsOnline();
  const reduceMotion = useReduceMotion();
  const [dockHeight, setDockHeight] = useState(0);
  const { training } = useTraining(trainingLogId);
  const { library } = useLibrary();
  const elapsedSeconds = useElapsedSeconds({
    startedAt: training?.startedAt,
    completedAt: training?.completedAt,
    durationSeconds: training?.durationSeconds,
  });

  if (!training) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const exercises = training.exercises ?? [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const totals = totalsOf(training);
  const records = exercises
    .filter((e) => e.completed)
    .map((e) => ({ id: e.id, name: e.exerciseName, record: personalRecordOf(e) }))
    .filter((r): r is { id: number; name: string; record: string } => r.record != null);
  const recordIds = new Set(records.map((r) => r.id));
  const musclesById = new Map(library.map((e) => [e.id, e.muscles ?? []]));
  const trained = combineMuscles(
    exercises.filter((e) => e.completed).map((e) => musclesById.get(e.libraryExerciseId) ?? []),
  );

  return (
    <View className="flex-1 bg-base">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: dockHeight + 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <Medal record={records.length > 0} reduceMotion={reduceMotion} />
          <Appear order={0} reduceMotion={reduceMotion}>
            <View className="items-center mt-3">
              <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">SESSION COMPLETE</Text>
              <Text className="text-primary text-[32px] font-bold tracking-tighter text-center">
                {records.length === 0 ? 'Nice work' : records.length === 1 ? 'New record!' : `${records.length} new records!`}
              </Text>
              <Text className="text-muted text-sm text-center" numberOfLines={1}>
                {[training.workoutName, training.splitName].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </Appear>
        </View>

        {/* Stats row */}
        <Appear order={1} reduceMotion={reduceMotion}>
          <View className="flex-row mb-3 bg-surface rim border-edge rounded-md py-4">
            <Stat
              value={elapsedSeconds == null ? '—' : elapsedSeconds < 60 ? `${elapsedSeconds}s` : formatDuration(elapsedSeconds)}
              label="DURATION"
            />
            <View className="w-px bg-elevated my-1" />
            <Stat value={String(totals.sets)} label="SETS" />
            <View className="w-px bg-elevated my-1" />
            <Stat value={formatNumber(Math.round(totals.volume))} label="KG LIFTED" />
            <View className="w-px bg-elevated my-1" />
            <Stat value={`${completedCount}/${exercises.length}`} label="EXERCISES" />
          </View>
        </Appear>

        {!isOnline && (
          <Appear order={2} reduceMotion={reduceMotion}>
            <View className="flex-row items-center gap-2 mb-3 bg-surface rounded-sm px-3 py-2 self-center">
              <Ionicons name="cloud-offline-outline" size={14} color={c.muted} />
              <Text className="text-muted text-[10px] tracking-[2px]">SAVED · SYNCS WHEN BACK ONLINE</Text>
            </View>
          </Appear>
        )}

        {/* Records */}
        {records.length > 0 && (
          <Appear order={2} reduceMotion={reduceMotion}>
            <View className="mb-3 bg-surface rim border-accent rounded-md p-4 gap-3">
              <Text className="text-accent-text text-[9px] tracking-[3px]">PERSONAL RECORDS</Text>
              {records.map((r) => (
                <View key={r.id} className="flex-row items-start gap-3">
                  <View className="w-7 h-7 rounded-full bg-accent justify-center items-center">
                    <Ionicons name="trophy" size={13} color={c.accentFg} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-primary text-sm font-bold tracking-tight">{r.name}</Text>
                    <Text className="text-muted text-xs mt-0.5">{r.record}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Appear>
        )}

        {/* Muscles trained */}
        {trained.length > 0 && (
          <Appear order={2} reduceMotion={reduceMotion}>
            <View className="mb-3 bg-surface rim border-edge rounded-md p-4">
              <Text className="text-muted text-[9px] tracking-[3px] mb-3">MUSCLES TRAINED</Text>
              <BodyMap
                fills={targetFills(trained, c)}
                height={170}
                animateIn
                delay={450}
                accessibilityLabel={`Muscles trained: ${muscleNames(trained.map((m) => m.muscle))}`}
              />
            </View>
          </Appear>
        )}

        {/* Exercises */}
        <Appear order={3} reduceMotion={reduceMotion}>
          <Text className="text-muted text-[9px] tracking-[3px] mt-2 mb-3">EXERCISES</Text>
        </Appear>
        {exercises.map((e, i) => {
          const delta = e.completed ? topSetDelta(e) : null;
          return (
            <Appear key={e.id} order={4 + i} reduceMotion={reduceMotion}>
              <View className={`flex-row items-center gap-3 mb-2 rounded-md px-4 py-3 rim ${e.completed ? 'bg-surface-done border-edge-done' : 'bg-surface border-edge'}`}>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-primary text-sm font-bold tracking-tight flex-shrink" numberOfLines={1}>{e.exerciseName}</Text>
                    {recordIds.has(e.id) && (
                      <View className="flex-row items-center gap-1 bg-accent rounded-sm px-1.5 py-0.5" accessibilityLabel="Personal record">
                        <Ionicons name="trophy" size={10} color={c.accentFg} />
                        <Text className="text-accent-fg text-[9px] font-bold tracking-[1px]">PR</Text>
                      </View>
                    )}
                  </View>
                  <Text className={`text-xs font-mono ${e.completed ? 'text-accent-text' : 'text-muted'}`} numberOfLines={1}>
                    {e.completed ? formatSets(setsOf(e), e.repUnit) || 'Done' : 'Skipped'}
                  </Text>
                </View>
                {delta != null && (
                  <View
                    className="items-end"
                    accessible
                    accessibilityLabel={`Top set ${describeDelta(delta)} against last time`}
                  >
                    <Text className={`text-xs font-mono-bold ${delta.value > 0 ? 'text-accent-text' : 'text-muted'}`}>
                      {describeDelta(delta)}
                    </Text>
                    <Text className="text-muted text-[8px] tracking-[1.5px]">TOP SET</Text>
                  </View>
                )}
              </View>
            </Appear>
          );
        })}
      </ScrollView>

      {/* Bottom dock */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-dock px-4 pt-3"
        style={{ paddingBottom: 32 + insets.bottom }}
        onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}
      >
        <Tactile className="rounded-md py-4 flex-row items-center justify-center gap-2" onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="checkmark" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">DONE</Text>
        </Tactile>
      </View>
    </View>
  );
}
