import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAddExerciseLog } from '@/hooks/useAddExerciseLog';
import { useReplaceExerciseLog } from '@/hooks/useReplaceExerciseLog';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { alert } from '@/utils/confirm';
import { useLibrary } from '@/hooks/useLibrary';
import { LibrarySuggestions, findLibraryMatch } from '@/components/LibrarySuggestions';
import { CatalogSuggestions } from '@/components/CatalogSuggestions';
import { MuscleSummary } from '@/components/MusclePicker';
import { useCatalog } from '@/hooks/useCatalog';
import { CatalogExercise } from '@/types';

import { Tactile } from '@/components/Tactile';
export default function AddExerciseScreen() {
  // With replaceExerciseLogId, the exercise takes that one's place for this session only
  const { trainingLogId, replaceExerciseLogId, replaceName, plannedSets, plannedReps } = useLocalSearchParams<{
    trainingLogId: string; replaceExerciseLogId?: string; replaceName?: string; plannedSets?: string; plannedReps?: string;
  }>();
  const replacing = !!replaceExerciseLogId;
  const router = useRouter();
  const { addExerciseLog, isPending: isAdding } = useAddExerciseLog(trainingLogId);
  const { replaceExerciseLog, isPending: isReplacing } = useReplaceExerciseLog(trainingLogId);
  const isPending = isAdding || isReplacing;
  const c = useTheme();

  // A replacement usually trains the same muscles, so it starts from the replaced plan
  const [form, setForm] = useState({
    name: '',
    sets: plannedSets ?? '',
    reps: plannedReps ?? '',
    weight: '',
  });

  const [addToWorkout, setAddToWorkout] = useState(true);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const { library } = useLibrary();
  const libraryMatch = findLibraryMatch(library, form.name);
  const { catalog } = useCatalog();
  // A picked catalog exercise brings its muscles along, as long as the name isn't edited again
  const [catalogPick, setCatalogPick] = useState<CatalogExercise | null>(null);
  const fromCatalog = !libraryMatch && catalogPick?.name === form.name.trim() ? catalogPick : null;
  const catalogMuscles = fromCatalog?.muscles;

  if (!trainingLogId) {
    return (
      <View className="flex-1 justify-center items-center bg-base p-6">
        <Text className="text-muted text-base mb-4">Missing training session.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-accent-text text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleAdd = () => {
    if (!form.name.trim()) {
      alert('Error', 'Please enter an exercise name');
      return;
    }

    const data = {
      ...(libraryMatch ? { libraryExerciseId: libraryMatch.id } : { name: form.name.trim() }),
      sets: form.sets ? parseInt(form.sets) : null,
      reps: form.reps ? parseInt(form.reps) : null,
      plannedWeight: form.weight ? parseFloat(form.weight) : null,
      equipment: fromCatalog?.equipment ?? undefined,
      muscles: catalogMuscles,
      catalogExerciseId: fromCatalog?.id,
    };
    const exerciseName = libraryMatch?.name ?? form.name.trim();
    if (replacing) {
      replaceExerciseLog(Number(replaceExerciseLogId), data, exerciseName);
    } else {
      addExerciseLog({ ...data, addToWorkout }, exerciseName);
    }
  };

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="pt-14 pb-5 px-6">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} disabled={isPending}>
            <Ionicons name="arrow-back" size={20} color={isPending ? c.subtle : c.accent} />
          </TouchableOpacity>
          <View>
            <Text className="text-accent-text text-[10px] tracking-[4px] mb-1 text-center">ACTIVE SESSION</Text>
            <Text className="text-primary text-[22px] font-bold tracking-tight text-center">{replacing ? 'REPLACE EXERCISE' : 'ADD EXERCISE'}</Text>
          </View>
          <View className="w-5" />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {replacing ? (
          <View className="flex-row items-center gap-3 mb-6 bg-surface border-2 border-edge border-b-[6px] rounded-md px-4 py-3">
            <Ionicons name="swap-horizontal" size={18} color={c.accent} />
            <View className="flex-1">
              <Text className="text-primary text-sm font-bold" numberOfLines={1}>Instead of {replaceName}</Text>
              <Text className="text-muted text-[11px] mt-0.5">Only this session. Your workout stays the same.</Text>
            </View>
          </View>
        ) : (
          <>
            {/* Scope */}
            <Text className="text-muted text-[9px] tracking-[3px] mb-2">WHERE SHOULD THIS GO?</Text>
            <View className="flex-row gap-3 mb-6">
              <Tactile
                variant={addToWorkout ? 'accent' : 'surface'}
                depth={3}
                className="py-3 rounded-md items-center"
                containerClassName="flex-1"
                onPress={() => setAddToWorkout(true)}
                disabled={isPending}
                accessibilityState={{ selected: addToWorkout }}
              >
                <Text className={`text-[12px] font-bold tracking-wider ${addToWorkout ? 'text-accent-fg' : 'text-primary'}`}>
                  ADD TO WORKOUT
                </Text>
                <Text className={`text-[10px] mt-1 ${addToWorkout ? 'text-accent-fg' : 'text-muted'}`}>
                  Also next time
                </Text>
              </Tactile>
              <Tactile
                variant={!addToWorkout ? 'accent' : 'surface'}
                depth={3}
                className="py-3 rounded-md items-center"
                containerClassName="flex-1"
                onPress={() => setAddToWorkout(false)}
                disabled={isPending}
                accessibilityState={{ selected: !addToWorkout }}
              >
                <Text className={`text-[12px] font-bold tracking-wider ${!addToWorkout ? 'text-accent-fg' : 'text-primary'}`}>
                  ONLY THIS SESSION
                </Text>
                <Text className={`text-[10px] mt-1 ${!addToWorkout ? 'text-accent-fg' : 'text-muted'}`}>
                  Temporary (won't save)
                </Text>
              </Tactile>
            </View>
          </>
        )}

        {/* Name */}
        <Text className="text-muted text-[9px] tracking-[3px] mb-2">EXERCISE NAME *</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 text-primary rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., Cable Fly, Dips"
          placeholderTextColor={c.subtle}
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />
        {libraryMatch && (
          <View className="flex-row items-center gap-2 -mt-2 mb-4">
            <Ionicons name="library-outline" size={14} color={c.accent} />
            <Text className="text-muted text-[10px] tracking-widest flex-1">IN YOUR LIBRARY · HISTORY IS SHARED</Text>
          </View>
        )}
        <LibrarySuggestions library={library} query={form.name} onSelect={(entry) => updateField('name')(entry.name)} />
        {!libraryMatch && (
          <CatalogSuggestions
            catalog={catalog}
            query={form.name}
            onSelect={(entry) => { setCatalogPick(entry); updateField('name')(entry.name); }}
          />
        )}
        {catalogMuscles && <MuscleSummary muscles={catalogMuscles} className="-mt-2 mb-4" />}

        {/* Sets */}
        <Text className="text-muted text-[9px] tracking-[3px] mb-2">SETS</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 text-primary rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., 3"
          placeholderTextColor={c.subtle}
          value={form.sets}
          onChangeText={updateField('sets')}
          keyboardType="numeric"
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />

        {/* Reps */}
        <Text className="text-muted text-[9px] tracking-[3px] mb-2">REPS</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 text-primary rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., 12"
          placeholderTextColor={c.subtle}
          value={form.reps}
          onChangeText={updateField('reps')}
          keyboardType="numeric"
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />

        {/* Weight */}
        <Text className="text-muted text-[9px] tracking-[3px] mb-2">PLANNED WEIGHT (KG)</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 text-primary rounded-md px-4 py-3 text-base mb-6"
          placeholder="e.g., 25"
          placeholderTextColor={c.subtle}
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
        />

        <Tactile
          className={`rounded-md py-4 flex-row items-center justify-center gap-2 ${isPending ? 'opacity-50' : ''}`} containerClassName="mb-10"
          onPress={handleAdd}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Ionicons name={replacing ? 'swap-horizontal' : 'add'} size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {replacing ? (isPending ? 'REPLACING...' : 'REPLACE EXERCISE') : isPending ? 'ADDING...' : 'ADD EXERCISE'}
          </Text>
        </Tactile>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
