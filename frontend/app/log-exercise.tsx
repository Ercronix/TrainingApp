import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useKeepScreenOn } from '@/hooks/useKeepScreenOn';
import { useTheme } from '@/hooks/useTheme';
import { useLibrary } from '@/hooks/useLibrary';
import { useRestoredDraft, usePersistDraft } from '@/hooks/useSetDraft';
import { useTimedSet } from '@/hooks/useTimedSet';
import { useAutoSaveSets } from '@/hooks/useAutoSaveSets';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { RestCountdown } from '@/components/RestTimer';
import { ExerciseIllustration, useIllustrationCatalogId } from '@/components/ExerciseIllustration';
import { Tactile } from '@/components/Tactile';
import { TargetLine } from '@/components/logExercise/TargetLine';
import { CompactSetRow, SetColumnHeader } from '@/components/logExercise/CompactSetRow';
import { ExpandedSetRow } from '@/components/logExercise/ExpandedSetRow';
import { useRestTimerStore } from '@/store/restTimerStore';
import { SetRow } from '@/store/setDraftStore';
import { useStepSize } from '@/store/stepSizeStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { usesPlates } from '@/constants/equipment';
import { previousSetsOf } from '@/utils/sets';
import {
  doneSetsOf, gainOf, isInvalidRow, loggedPatch, nextRow, prefillRows, previousLabel, rowDefaultsOf, setLabels,
  steppedReps, steppedWeight, targetOf,
} from '@/utils/logExercise';
import { toast } from '@/utils/confirm';
import { haptics } from '@/utils/haptics';
import { TrainingLog } from '@/types';

/** Starts (or restarts) the rest between sets; the timer lives outside the screen. */
const startRest = () => useRestTimerStore.getState().restart();

export default function LogExerciseModal() {
  const { exerciseLogId, trainingLogId, exerciseName } = useLocalSearchParams<{
    exerciseLogId: string; trainingLogId: string; exerciseName: string;
  }>();
  const queryClient = useQueryClient();
  const [log] = useState(() => queryClient.getQueryData<TrainingLog>(QUERY_KEYS.training(trainingLogId))
    ?.exercises.find((e) => e.id === Number(exerciseLogId)));
  const defaults = rowDefaultsOf(log);
  const draft = useRestoredDraft(exerciseLogId, log);
  const [rows, setRows] = useState<SetRow[]>(() => draft?.rows ?? prefillRows(log));
  // The set being edited: the first one not done yet
  const [focused, setFocused] = useState(() => Math.max(0, rows.findIndex((r) => !r.done)));
  const { timing, elapsed, start: startTiming, stop: stopTiming } = useTimedSet(draft?.timing, rows, defaults);
  // The set logged last, whose gain badge pops in
  const [lastLogged, setLastLogged] = useState<number | null>(null);
  const router = useRouter();
  useKeepScreenOn();
  const c = useTheme();
  const libraryExerciseId = log?.libraryExerciseId?.toString();
  const step = useStepSize(libraryExerciseId);
  const isTimed = log?.repUnit === 'seconds';
  const unitShort = isTimed ? 'sec' : 'reps';
  const previous = log ? previousSetsOf(log) : [];
  // From the library, so a change made on the details screen shows on return
  const { library } = useLibrary();
  const equipment = library.find((l) => l.id === log?.libraryExerciseId)?.equipment ?? log?.equipment;
  const showPlates = usesPlates(equipment) && !isTimed;
  const drawingId = useIllustrationCatalogId(log?.libraryExerciseId);
  const target = targetOf(log);

  usePersistDraft(exerciseLogId, rows, timing);

  const { doneRows, sets: doneSets } = doneSetsOf(rows);
  const { saveNextChangeNow, saveCompleted } = useAutoSaveSets(exerciseLogId, trainingLogId, log, doneSets);

  // Closing with every set logged marks the exercise done, even short of or without a plan
  const allDone = rows.length > 0 && rows.every((r) => r.done) && doneSets != null;
  const finish = () => {
    if (allDone && doneSets != null) saveCompleted(doneSets);
    router.back();
  };

  const updateRow = (index: number, patch: Partial<SetRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const toggleWarmup = (index: number) => {
    if (rows[index].done) saveNextChangeNow();
    updateRow(index, { warmup: !rows[index].warmup });
  };

  const addSet = () => {
    setRows((prev) => [...prev, nextRow(prev)]);
    setFocused(rows.length);
  };

  const removeSet = (index: number) => {
    if (rows[index].done) saveNextChangeNow();
    stopTiming();
    setRows((prev) => prev.filter((_, i) => i !== index));
    setFocused((f) => (f >= index && f > 0 ? f - 1 : f));
  };

  /**
   * Every set logged (by a tap, or by stopping its stopwatch) ends up here: a record is
   * celebrated, the rest starts and editing moves on to the next set.
   */
  const onSetLogged = (index: number, logged: SetRow) => {
    const gain = gainOf(rows.map((r, i) => (i === index ? logged : r)), index, log, previous);
    if (gain?.record) {
      haptics.record();
      toast('New record!', gain.record, 'trophy');
    } else {
      haptics.check();
    }
    setLastLogged(index);
    startRest();
    if (index + 1 < rows.length) setFocused(index + 1);
  };

  const toggleDone = (index: number) => {
    const row = rows[index];
    saveNextChangeNow();
    if (row.done) {
      haptics.uncheck();
      updateRow(index, { done: false });
      return;
    }
    // One tap logs the set as shown; empty values take the defaults
    const patch = loggedPatch(row, defaults);
    updateRow(index, patch);
    onSetLogged(index, { ...row, ...patch });
  };

  const toggleTiming = (index: number) => {
    if (timing?.index === index) {
      // Stopping records the time held as the set's seconds and finishes it
      saveNextChangeNow();
      updateRow(index, { reps: String(elapsed), done: true });
      stopTiming();
      onSetLogged(index, { ...rows[index], reps: String(elapsed), done: true });
      return;
    }
    startTiming(index);
    setFocused(index);
  };

  const labels = setLabels(rows);
  const gains = rows.map((_, i) => gainOf(rows, i, log, previous));

  // Notes, video, muscles, equipment and history
  const openDetails = () =>
    log && router.push({
      pathname: '/exercise-detail' as any,
      params: {
        exerciseId: log.exerciseId?.toString() ?? '', exerciseName: log.exerciseName,
        libraryExerciseId: log.libraryExerciseId?.toString() ?? '', description: '', videoUrl: '',
        sets: log.plannedSets?.toString() || '', reps: log.plannedReps?.toString() || '',
        weight: log.plannedWeight?.toString() || '', workoutId: log.workoutId?.toString() ?? '',
      },
    });

  return (
    <View className="flex-1 bg-base">
      <KeyboardAvoidingWrapper>
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">LOG EXERCISE</Text>
        <TouchableOpacity
          onPress={openDetails}
          disabled={!log}
          accessibilityLabel="Exercise details"
        >
          <Ionicons name="information-circle-outline" size={22} color={c.muted} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pb-10">
        <View className="flex-row items-center gap-3 mb-4 px-1">
          <Text className="flex-1 text-primary text-[32px] font-bold tracking-tighter leading-9">
            {log?.exerciseName ?? exerciseName}
          </Text>
          {drawingId != null && (
            <TouchableOpacity onPress={openDetails} activeOpacity={0.85} accessibilityLabel="How it's done, and exercise details">
              <ExerciseIllustration catalogExerciseId={drawingId} width={76} height={76} background={c.glass ? 'transparent' : c.base} animate />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row flex-wrap gap-2 mb-6 px-1">
          {target && <TargetLine target={target} unitShort={unitShort} />}
          <RestCountdown />
        </View>

        <SetColumnHeader unitShort={unitShort} />

        {rows.map((row, i) =>
          i === focused ? (
            <View key={i}>
              <ExpandedSetRow
                row={row}
                index={i}
                label={labels[i]}
                previous={previousLabel(previous[i], isTimed)}
                gain={gains[i]}
                invalid={isInvalidRow(row)}
                defaults={defaults}
                unitShort={unitShort}
                isTimed={isTimed}
                showPlates={showPlates}
                step={step}
                libraryExerciseId={libraryExerciseId}
                canRemove={rows.length > 1}
                timing={timing == null ? null : timing.index === i ? 'this' : 'other'}
                elapsed={elapsed}
                onChange={(patch) => updateRow(i, patch)}
                onStepWeight={(direction) => updateRow(i, { weight: steppedWeight(row.weight, defaults.weight, step, direction) })}
                onStepReps={(direction) => updateRow(i, { reps: steppedReps(row.reps, defaults.reps, direction) })}
                onToggleWarmup={() => toggleWarmup(i)}
                onRemove={() => removeSet(i)}
                onToggleTiming={() => toggleTiming(i)}
                onToggleDone={() => toggleDone(i)}
              />
            </View>
          ) : (
            <View key={i} className="mb-2">
              <CompactSetRow
                row={row}
                index={i}
                label={labels[i]}
                previous={previousLabel(previous[i], isTimed)}
                gain={gains[i]}
                animateGain={lastLogged === i}
                invalid={isInvalidRow(row)}
                defaults={defaults}
                unitShort={unitShort}
                timing={timing?.index === i}
                elapsed={elapsed}
                onEdit={() => setFocused(i)}
                onToggleDone={() => toggleDone(i)}
              />
            </View>
          ),
        )}

        <TouchableOpacity
          className="border border-dashed border-elevated rounded-md py-3 flex-row items-center justify-center gap-2 mb-5"
          onPress={addSet}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color={c.accent} />
          <Text className="text-primary text-xs font-bold tracking-[2px]">ADD SET</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        {/* Sets are saved as they're logged, so this only closes the screen (and completes the exercise once all are logged) */}
        <Tactile
          variant={allDone ? 'accent' : 'surface'}
          className="rounded-md py-5 flex-row items-center justify-center gap-2"
          onPress={finish}
        >
          <Ionicons name="checkmark-done" size={18} color={allDone ? c.accentFg : c.accent} />
          <Text className={`text-sm font-bold tracking-[2px] ${allDone ? 'text-accent-fg' : 'text-primary'}`}>
            DONE{doneRows.length > 0 ? ` · ${doneRows.length} ${doneRows.length === 1 ? 'SET' : 'SETS'} LOGGED` : ''}
          </Text>
        </Tactile>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
