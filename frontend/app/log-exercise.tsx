import { View, Text, TextInput, TouchableOpacity, Vibration } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useExerciseLog } from '@/hooks/useExerciseLog';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { PlateCalculator } from '@/components/PlateCalculator';
import { RestCountdown } from '@/components/RestTimer';
import { useRestTimerStore } from '@/store/restTimerStore';
import { SetDraft, SetRow, useSetDraftStore } from '@/store/setDraftStore';
import { STEP_INCREMENT_KG, useStepSize, useStepSizeStore } from '@/store/stepSizeStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { formatSets, previousSetsOf, workingSets } from '@/utils/sets';
import { ExerciseLog, SetLog, TrainingLog } from '@/types';

const emptyRow: SetRow = { weight: '', reps: '', rpe: '', warmup: false, done: false };

const toRow = (s: SetLog, logged: boolean): SetRow => ({
  weight: s.weight != null ? String(s.weight) : '',
  reps: String(s.reps),
  rpe: logged && s.rpe != null ? String(s.rpe) : '',
  warmup: s.warmup,
  done: logged,
});

// Prefill: what's already logged this session, else last session, else the plan
function initialRows(log: ExerciseLog | undefined): SetRow[] {
  if (!log) return [{ ...emptyRow }];
  if (log.sets?.length) return log.sets.map((s) => toRow(s, true));
  const previous = previousSetsOf(log);
  if (previous.length) return previous.map((s) => toRow(s, false));
  const planned = log.plannedSets ?? 0;
  const row: SetRow = {
    weight: log.plannedWeight != null ? String(log.plannedWeight) : '',
    reps: log.plannedReps != null ? String(log.plannedReps) : '',
    rpe: '',
    warmup: false,
    done: false,
  };
  return Array.from({ length: Math.max(planned, 1) }, () => ({ ...row }));
}

const parseNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (n: number) => String(Math.round(n * 100) / 100);

/** The set a row describes, or null when its values can't be saved. */
function toSet(row: SetRow): SetLog | null {
  const reps = parseInt(row.reps, 10);
  if (!/^\d+$/.test(row.reps.trim()) || !Number.isFinite(reps)) return null;
  const weight = row.weight.trim() ? parseNumber(row.weight) : null;
  if (row.weight.trim() && (weight == null || weight < 0 || weight > 999.99)) return null;
  const rpe = row.rpe.trim() ? parseNumber(row.rpe) : null;
  if (row.rpe.trim() && (rpe == null || rpe < 1 || rpe > 10)) return null;
  return { reps, weight, rpe, warmup: row.warmup };
}

/**
 * The update a set of rows saves: every done set, and `completed` once the working sets
 * reach the plan. Without a plan, completion stays manual (undefined leaves it unchanged).
 */
function payloadOf(sets: SetLog[], log: ExerciseLog | undefined) {
  const planned = log?.plannedSets;
  return { sets, completed: planned ? workingSets(sets).length >= planned : undefined };
}

const SAVE_DEBOUNCE_MS = 600;

const keyOf = (payload: ReturnType<typeof payloadOf>) => JSON.stringify(payload);

/** Seconds a timed set aims for: its entered value, else the plan. NaN when neither is set. */
const targetOf = (rows: SetRow[], index: number, log: ExerciseLog | undefined) =>
  parseInt(rows[index]?.reps || String(log?.plannedReps ?? ''), 10);

export default function LogExerciseModal() {
  const { exerciseLogId, trainingLogId, exerciseName } = useLocalSearchParams<{
    exerciseLogId: string; trainingLogId: string; exerciseName: string;
  }>();
  const queryClient = useQueryClient();
  const [log] = useState(() => queryClient.getQueryData<TrainingLog>(QUERY_KEYS.training(trainingLogId))
    ?.exercises.find((e) => e.id === Number(exerciseLogId)));
  // State left on an earlier visit wins over the prefill, unless the sets it logged no longer
  // match the server's (e.g. the exercise was ticked off on the training screen since): it
  // would otherwise be saved back over them
  const [draft] = useState(() => {
    const saved = useSetDraftStore.getState().drafts[exerciseLogId];
    if (!saved) return undefined;
    const draftSets = saved.rows.filter((r) => r.done).map(toSet);
    // A done set with invalid values was never saved, so there is nothing to compare
    if (draftSets.some((s) => s == null)) return saved;
    const serverSets = (log?.sets ?? []).map((s) => toSet(toRow(s, true)));
    return JSON.stringify(draftSets) === JSON.stringify(serverSets) ? saved : undefined;
  });
  const [rows, setRows] = useState<SetRow[]>(() => draft?.rows ?? initialRows(log));
  // The set being edited: the first one not done yet
  const [focused, setFocused] = useState(() => Math.max(0, rows.findIndex((r) => !r.done)));
  // Stopwatch of the set being performed, for timed exercises
  const [timing, setTiming] = useState<SetDraft['timing']>(draft?.timing ?? null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  // A stopwatch restored past its target already buzzed (or ran out while away)
  const vibrated = useRef(draft?.timing != null && Date.now() - draft.timing.startedAt >= targetOf(draft.rows, draft.timing.index, log) * 1000);
  // What the server already has, so only real changes are sent
  // (through the same row conversion, so equal sets give equal keys)
  const lastSaved = useRef(keyOf(payloadOf((log?.sets ?? []).map((s) => toSet(toRow(s, true)) as SetLog), log)));
  const router = useRouter();
  const { saveSets } = useExerciseLog(exerciseLogId, trainingLogId);
  const c = useTheme();
  const libraryExerciseId = log?.libraryExerciseId?.toString();
  const step = useStepSize(libraryExerciseId);
  const repUnit = log?.repUnit ?? 'reps';
  const unitShort = repUnit === 'seconds' ? 'sec' : 'reps';
  const previous = log ? previousSetsOf(log) : [];
  const isTimed = repUnit === 'seconds';
  const elapsed = timing ? Math.max(0, Math.floor((nowMs - timing.startedAt) / 1000)) : 0;

  useEffect(() => {
    if (!timing) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(timer);
  }, [timing]);

  // Buzz once when the timed set reaches its target
  const target = timing ? targetOf(rows, timing.index, log) : NaN;
  useEffect(() => {
    if (timing && !vibrated.current && target > 0 && elapsed >= target) {
      vibrated.current = true;
      Vibration.vibrate(500);
    }
  }, [timing, elapsed, target]);

  useEffect(() => {
    useSetDraftStore.getState().setDraft(exerciseLogId, { rows, timing });
  }, [exerciseLogId, rows, timing]);

  // Every change to the done sets is saved. A done set with invalid values holds the
  // save back (it's outlined), so it can't replace good sets on the server.
  const doneRows = rows.filter((r) => r.done);
  const doneSets = doneRows.map(toSet);
  const hasInvalid = doneSets.some((s) => s == null);
  const payloadKey = hasInvalid ? null : keyOf(payloadOf(doneSets as SetLog[], log));
  // Set when a set is logged or undone, or a done one is removed or switched to/from
  // warm-up: saved at once. Value edits wait for a pause, so a run of stepper taps
  // becomes one request.
  const saveNow = useRef(false);
  // A debounced save not sent yet; flushed when the screen closes
  const pending = useRef<string | null>(null);
  const saveSetsRef = useRef(saveSets);
  useEffect(() => { saveSetsRef.current = saveSets; }, [saveSets]);

  useEffect(() => {
    const immediate = saveNow.current;
    saveNow.current = false;
    const save = (key: string) => {
      pending.current = null;
      if (key === lastSaved.current) return;
      lastSaved.current = key;
      const { sets, completed } = JSON.parse(key) as ReturnType<typeof payloadOf>;
      saveSetsRef.current(sets, completed);
    };
    if (payloadKey == null || payloadKey === lastSaved.current) {
      pending.current = null;
      return;
    }
    if (immediate) {
      save(payloadKey);
      return;
    }
    pending.current = payloadKey;
    const timer = setTimeout(() => save(payloadKey), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [payloadKey]);

  useEffect(() => () => {
    const key = pending.current;
    if (key == null || key === lastSaved.current) return;
    lastSaved.current = key;
    const { sets, completed } = JSON.parse(key) as ReturnType<typeof payloadOf>;
    saveSetsRef.current(sets, completed);
  }, []);

  const updateRow = (index: number, patch: Partial<SetRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const toggleWarmup = (index: number) => {
    if (rows[index].done) saveNow.current = true;
    updateRow(index, { warmup: !rows[index].warmup });
  };

  const addSet = () => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, last ? { ...last, rpe: '', warmup: false, done: false } : { ...emptyRow }];
    });
    setFocused(rows.length);
  };

  const removeSet = (index: number) => {
    if (rows[index].done) saveNow.current = true;
    setTiming(null);
    setRows((prev) => prev.filter((_, i) => i !== index));
    setFocused((f) => (f >= index && f > 0 ? f - 1 : f));
  };

  const toggleDone = (index: number) => {
    const row = rows[index];
    saveNow.current = true;
    if (row.done) {
      updateRow(index, { done: false });
      return;
    }
    // One tap logs the set as shown; empty values take the plan's
    updateRow(index, {
      done: true,
      reps: row.reps.trim() || (log?.plannedReps != null ? String(log.plannedReps) : ''),
      weight: row.weight.trim() || (log?.plannedWeight != null ? String(log.plannedWeight) : ''),
    });
    finishSet(index);
  };

  // Rest starts, and editing moves on to the next set
  const finishSet = (index: number) => {
    useRestTimerStore.getState().restart();
    if (index + 1 < rows.length) setFocused(index + 1);
  };

  const toggleTiming = (index: number) => {
    if (timing?.index === index) {
      // Stopping records the time held as the set's seconds and finishes it
      saveNow.current = true;
      updateRow(index, { reps: String(elapsed), done: true });
      setTiming(null);
      finishSet(index);
      return;
    }
    vibrated.current = false;
    setTiming({ index, startedAt: Date.now() });
    setFocused(index);
  };

  const stepWeight = (index: number, direction: 1 | -1) => {
    const base = parseNumber(rows[index].weight) ?? log?.plannedWeight ?? 0;
    updateRow(index, { weight: formatNumber(Math.max(0, base + direction * step)) });
  };

  const stepReps = (index: number, direction: 1 | -1) => {
    const base = parseInt(rows[index].reps, 10);
    const current = Number.isFinite(base) ? base : (log?.plannedReps ?? 0);
    updateRow(index, { reps: String(Math.max(0, current + direction)) });
  };

  // Set numbers count working sets only; warm-ups show as W
  const labels: string[] = [];
  let workingNumber = 0;
  for (const r of rows) labels.push(r.warmup ? 'W' : String(++workingNumber));

  const current = rows[focused];
  const currentTiming = timing?.index === focused;
  const invalid = (row: SetRow) => row.done && toSet(row) == null;

  const stepButton = (icon: 'remove' | 'add', onPress: () => void, label: string, disabled = false) => (
    <TouchableOpacity
      className="w-14 h-14 rounded bg-surface justify-center items-center"
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={24} color={disabled ? c.elevated : c.accent} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-base">
      <KeyboardAvoidingWrapper>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">LOG EXERCISE</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6 pb-10">
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9 mb-4">
          {log?.exerciseName ?? exerciseName}
        </Text>

        <View className="flex-row flex-wrap gap-2 mb-6">
          {log?.plannedSets != null && log.plannedReps != null && (
            <View className="bg-accent/10 rounded-sm px-3 py-2">
              <Text className="text-accent-text text-[11px] tracking-widest">
                TARGET: {log.plannedSets} × {log.plannedReps} {unitShort}{log.plannedWeight ? ` @ ${log.plannedWeight} kg` : ''}
              </Text>
            </View>
          )}
          {previous.length > 0 && (
            <View className="bg-surface rounded-sm px-3 py-2">
              <Text className="text-muted text-[11px] tracking-widest">LAST: {formatSets(previous, repUnit)}</Text>
            </View>
          )}
          <RestCountdown />
        </View>

        {/* Sets: tap the circle to log a set as shown, tap the row to adjust it */}
        {rows.map((row, i) => {
          const isFocused = i === focused;
          const borderClass = invalid(row) ? 'border-2 border-danger' : isFocused ? 'border-2 border-accent' : 'border-2 border-transparent';
          return (
            <View key={i} className={`flex-row items-center gap-2 mb-2 rounded-md ${row.done ? 'bg-surface-done' : 'bg-surface'} ${borderClass}`}>
              {/* Tap to switch between warm-up and working set */}
              <TouchableOpacity
                className={`w-10 h-14 rounded-l justify-center items-center ${row.done ? 'bg-accent' : row.warmup ? 'bg-elevated' : 'bg-accent/10'}`}
                onPress={() => toggleWarmup(i)}
                accessibilityLabel={row.warmup ? 'Warm-up set, tap to make it a working set' : 'Working set, tap to make it a warm-up'}
              >
                <Text className={`text-sm font-bold ${row.done ? 'text-accent-fg' : row.warmup ? 'text-muted' : 'text-accent-text'}`}>
                  {labels[i]}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 h-14 flex-row items-center gap-4"
                onPress={() => setFocused(i)}
                accessibilityLabel={`Edit set ${i + 1}`}
              >
                <Text className="text-primary text-lg font-bold tracking-tight">
                  {row.weight || log?.plannedWeight || 0}<Text className="text-muted text-xs font-normal"> kg</Text>
                </Text>
                <Text className="text-primary text-lg font-bold tracking-tight">
                  {timing?.index === i ? elapsed : row.reps || log?.plannedReps || 0}
                  <Text className="text-muted text-xs font-normal"> {unitShort}</Text>
                </Text>
                {row.rpe.trim() !== '' && (
                  <Text className="text-muted text-xs">RPE {row.rpe}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="w-14 h-14 justify-center items-center"
                onPress={() => toggleDone(i)}
                disabled={timing?.index === i}
                accessibilityLabel={row.done ? `Mark set ${i + 1} as not done` : `Log set ${i + 1} as shown and start rest`}
              >
                <Ionicons
                  name={row.done ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={34}
                  color={row.done ? c.accent : c.muted}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          className="bg-surface rounded-md py-3 flex-row items-center justify-center gap-2 mt-1 mb-5"
          onPress={addSet}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color={c.accent} />
          <Text className="text-primary text-xs font-bold tracking-[2px]">ADD SET</Text>
        </TouchableOpacity>

        {/* Editor of the focused set */}
        {current && (
          <View className="bg-surface rounded-md p-4 mb-5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-accent-text text-[10px] tracking-[3px]">
                {current.warmup ? 'WARM-UP SET' : `SET ${labels[focused]}`}
              </Text>
              <TouchableOpacity
                onPress={() => removeSet(focused)}
                disabled={rows.length === 1}
                accessibilityLabel={`Remove set ${focused + 1}`}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="trash-outline" size={14} color={rows.length === 1 ? c.elevated : c.muted} />
                <Text className={`text-[10px] tracking-[2px] ${rows.length === 1 ? 'text-dim' : 'text-muted'}`}>REMOVE</Text>
              </TouchableOpacity>
            </View>

            {/* Weight */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-muted text-[9px] tracking-[2px]">KG</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-muted text-[9px] tracking-[2px]">STEP</Text>
                  <TouchableOpacity
                    onPress={() => libraryExerciseId && useStepSizeStore.getState().adjustStep(libraryExerciseId, -STEP_INCREMENT_KG)}
                    disabled={!libraryExerciseId}
                    accessibilityLabel="Decrease weight step"
                  >
                    <Ionicons name="remove-circle-outline" size={18} color={c.muted} />
                  </TouchableOpacity>
                  <Text className="text-primary text-xs font-bold min-w-[32px] text-center">{formatNumber(step)}</Text>
                  <TouchableOpacity
                    onPress={() => libraryExerciseId && useStepSizeStore.getState().adjustStep(libraryExerciseId, STEP_INCREMENT_KG)}
                    disabled={!libraryExerciseId}
                    accessibilityLabel="Increase weight step"
                  >
                    <Ionicons name="add-circle-outline" size={18} color={c.muted} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                {stepButton('remove', () => stepWeight(focused, -1), `Decrease weight by ${formatNumber(step)} kg`)}
                {/* min-w-0: on web an <input> won't shrink below its default ~20ch width, overflowing the row */}
                <TextInput
                  className="flex-1 min-w-0 h-14 bg-base rounded px-3 text-primary text-2xl font-bold tracking-tight text-center"
                  placeholder={log?.plannedWeight != null ? String(log.plannedWeight) : '0'}
                  placeholderTextColor={c.elevated}
                  value={current.weight}
                  onChangeText={(weight) => updateRow(focused, { weight })}
                  keyboardType="decimal-pad"
                  keyboardAppearance="dark"
                />
                {stepButton('add', () => stepWeight(focused, 1), `Increase weight by ${formatNumber(step)} kg`)}
              </View>
            </View>

            {/* Reps or seconds */}
            <View>
              <Text className="text-muted text-[9px] tracking-[2px] mb-2">{unitShort.toUpperCase()}</Text>
              <View className="flex-row items-center gap-2">
                {stepButton('remove', () => stepReps(focused, -1), `Decrease ${unitShort}`, currentTiming)}
                <TextInput
                  className="flex-1 min-w-0 h-14 bg-base rounded px-3 text-primary text-2xl font-bold tracking-tight text-center"
                  placeholder={log?.plannedReps != null ? String(log.plannedReps) : '0'}
                  placeholderTextColor={c.elevated}
                  value={currentTiming ? String(elapsed) : current.reps}
                  editable={!currentTiming}
                  onChangeText={(reps) => updateRow(focused, { reps })}
                  keyboardType="number-pad"
                  keyboardAppearance="dark"
                />
                {stepButton('add', () => stepReps(focused, 1), `Increase ${unitShort}`, currentTiming)}
              </View>
            </View>

            {/* RPE */}
            <View className="flex-row items-center gap-3">
              <Text className="text-muted text-[9px] tracking-[2px]">RPE</Text>
              <TextInput
                className="w-20 h-10 bg-base rounded px-3 text-primary text-base font-bold text-center"
                placeholder="–"
                placeholderTextColor={c.elevated}
                value={current.rpe}
                onChangeText={(rpe) => updateRow(focused, { rpe })}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
              />
              {invalid(current) && (
                <Text className="text-danger text-[11px] flex-1">Check the values; this set isn&apos;t saved yet.</Text>
              )}
            </View>

            {isTimed && !current.done ? (
              <TouchableOpacity
                className={`rounded-md py-4 flex-row items-center justify-center gap-2 ${currentTiming ? 'bg-accent' : 'bg-accent/10'}`}
                onPress={() => toggleTiming(focused)}
                disabled={timing != null && !currentTiming}
                accessibilityLabel={currentTiming ? `Stop timing set ${focused + 1}` : `Start timing set ${focused + 1}`}
              >
                <Ionicons name={currentTiming ? 'stop' : 'play'} size={18} color={currentTiming ? c.accentFg : c.accent} />
                <Text className={`text-sm font-bold tracking-[2px] ${currentTiming ? 'text-accent-fg' : 'text-accent-text'}`}>
                  {currentTiming ? 'STOP & LOG SET' : 'START TIMER'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`rounded-md py-4 flex-row items-center justify-center gap-2 ${current.done ? 'bg-base' : 'bg-accent/10'}`}
                onPress={() => toggleDone(focused)}
              >
                <Ionicons name={current.done ? 'arrow-undo' : 'checkmark'} size={18} color={current.done ? c.muted : c.accent} />
                <Text className={`text-sm font-bold tracking-[2px] ${current.done ? 'text-muted' : 'text-accent-text'}`}>
                  {current.done ? 'UNDO SET' : 'LOG SET'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <PlateCalculator weight={current?.weight ?? ''} />
        <View className="h-3" />

        {/* Sets are saved as they're logged, so this only closes the screen */}
        <TouchableOpacity
          className="bg-accent rounded-md py-5 flex-row items-center justify-center gap-2"
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            DONE{doneRows.length > 0 ? ` · ${doneRows.length} ${doneRows.length === 1 ? 'SET' : 'SETS'} LOGGED` : ''}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
