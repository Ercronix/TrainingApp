import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useExerciseLog } from '@/hooks/useExerciseLog';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { PlateCalculator } from '@/components/PlateCalculator';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { formatSets, previousSetsOf } from '@/utils/sets';
import { ExerciseLog, SetLog, TrainingLog } from '@/types';

interface SetRow {
  weight: string;
  reps: string;
  rpe: string;
  warmup: boolean;
}

const toRow = (s: SetLog, keepRpe: boolean): SetRow => ({
  weight: s.weight != null ? String(s.weight) : '',
  reps: String(s.reps),
  rpe: keepRpe && s.rpe != null ? String(s.rpe) : '',
  warmup: s.warmup,
});

// Prefill: what's already logged this session, else last session, else the plan
function initialRows(log: ExerciseLog | undefined): SetRow[] {
  if (!log) return [{ weight: '', reps: '', rpe: '', warmup: false }];
  if (log.sets?.length) return log.sets.map((s) => toRow(s, true));
  const previous = previousSetsOf(log);
  if (previous.length) return previous.map((s) => toRow(s, false));
  const planned = log.plannedSets ?? 0;
  const row: SetRow = {
    weight: log.plannedWeight != null ? String(log.plannedWeight) : '',
    reps: log.plannedReps != null ? String(log.plannedReps) : '',
    rpe: '',
    warmup: false,
  };
  return Array.from({ length: Math.max(planned, 1) }, () => ({ ...row }));
}

const parseNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default function LogExerciseModal() {
  const { exerciseLogId, exerciseId, trainingLogId, exerciseName } = useLocalSearchParams<{
    exerciseLogId: string; exerciseId: string; trainingLogId: string; exerciseName: string;
  }>();
  const queryClient = useQueryClient();
  const [log] = useState(() => queryClient.getQueryData<TrainingLog>(QUERY_KEYS.training(trainingLogId))
    ?.exercises.find((e) => e.id === Number(exerciseLogId)));
  const [rows, setRows] = useState<SetRow[]>(() => initialRows(log));
  const [focused, setFocused] = useState(0);
  const router = useRouter();
  const { saveExercise, isPending } = useExerciseLog(exerciseLogId, trainingLogId, exerciseId);
  const c = useTheme();
  const repUnit = log?.repUnit ?? 'reps';
  const unitShort = repUnit === 'seconds' ? 'sec' : 'reps';
  const previous = log ? previousSetsOf(log) : [];

  const updateRow = (index: number, patch: Partial<SetRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addSet = () => {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, last ? { ...last, rpe: '', warmup: false } : { weight: '', reps: '', rpe: '', warmup: false }];
    });
    setFocused(rows.length);
  };

  const removeSet = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setFocused((f) => (f >= index && f > 0 ? f - 1 : f));
  };

  const handleSave = () => {
    const sets: SetLog[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Rows without reps weren't performed
      if (!row.reps.trim()) continue;
      const reps = parseInt(row.reps, 10);
      const weight = row.weight.trim() ? parseNumber(row.weight) : null;
      const rpe = row.rpe.trim() ? parseNumber(row.rpe) : null;
      if (!Number.isFinite(reps) || reps < 0 || (row.weight.trim() && (weight == null || weight < 0 || weight > 999.99))) {
        alert('Invalid set', `Check the ${unitShort} and weight of set ${i + 1}.`);
        return;
      }
      if (row.rpe.trim() && (rpe == null || rpe < 1 || rpe > 10)) {
        alert('Invalid RPE', `RPE of set ${i + 1} must be between 1 and 10.`);
        return;
      }
      sets.push({ reps, weight, rpe, warmup: row.warmup });
    }
    if (sets.length === 0) {
      alert('No sets', `Enter the ${unitShort} of at least one set.`);
      return;
    }
    saveExercise(sets);
  };

  let workingNumber = 0;

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
        </View>

        {/* Column labels */}
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-muted text-[9px] tracking-[2px] w-10 text-center">SET</Text>
          <Text className="text-muted text-[9px] tracking-[2px] flex-1">KG</Text>
          <Text className="text-muted text-[9px] tracking-[2px] flex-1">{unitShort.toUpperCase()}</Text>
          <Text className="text-muted text-[9px] tracking-[2px] w-14">RPE</Text>
          <View className="w-8" />
        </View>

        {rows.map((row, i) => {
          if (!row.warmup) workingNumber++;
          const inputClass = 'bg-surface rounded px-3 py-3 text-primary text-lg font-bold tracking-tight';
          const onFocus = () => setFocused(i);
          return (
            <View key={i} className="flex-row items-center gap-2 mb-2">
              {/* Tap to switch between warm-up and working set */}
              <TouchableOpacity
                className={`w-10 h-12 rounded justify-center items-center ${row.warmup ? 'bg-elevated' : 'bg-accent/10'}`}
                onPress={() => updateRow(i, { warmup: !row.warmup })}
                accessibilityLabel={row.warmup ? 'Warm-up set, tap to make it a working set' : 'Working set, tap to make it a warm-up'}
              >
                <Text className={`text-sm font-bold ${row.warmup ? 'text-muted' : 'text-accent-text'}`}>
                  {row.warmup ? 'W' : workingNumber}
                </Text>
              </TouchableOpacity>
              <TextInput
                className={`${inputClass} flex-1`}
                placeholder={log?.plannedWeight != null ? String(log.plannedWeight) : '0'}
                placeholderTextColor={c.elevated}
                value={row.weight}
                onChangeText={(weight) => updateRow(i, { weight })}
                onFocus={onFocus}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
              />
              <TextInput
                className={`${inputClass} flex-1`}
                placeholder={log?.plannedReps != null ? String(log.plannedReps) : '0'}
                placeholderTextColor={c.elevated}
                value={row.reps}
                onChangeText={(reps) => updateRow(i, { reps })}
                onFocus={onFocus}
                keyboardType="number-pad"
                keyboardAppearance="dark"
              />
              <TextInput
                className={`${inputClass} w-14`}
                placeholder="–"
                placeholderTextColor={c.elevated}
                value={row.rpe}
                onChangeText={(rpe) => updateRow(i, { rpe })}
                onFocus={onFocus}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
              />
              <TouchableOpacity
                className="w-8 h-12 justify-center items-center"
                onPress={() => removeSet(i)}
                disabled={rows.length === 1}
                accessibilityLabel={`Remove set ${i + 1}`}
              >
                <Ionicons name="remove-circle-outline" size={20} color={rows.length === 1 ? c.elevated : c.muted} />
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

        <PlateCalculator weight={rows[focused]?.weight ?? ''} />
        <View className="h-3" />

        <TouchableOpacity
          className={`bg-accent rounded-md py-5 flex-row items-center justify-center gap-2 ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={handleSave}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE & COMPLETE'}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
