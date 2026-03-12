import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditExercise } from '@/hooks/useEditExercise';

export default function EditExerciseModal() {
  const { workoutId, exerciseId, currentName, currentSets, currentReps, currentWeight } =
    useLocalSearchParams<{
      workoutId: string;
      exerciseId: string;
      currentName: string;
      currentSets: string;
      currentReps: string;
      currentWeight: string;
    }>();

  const router = useRouter();
  const [form, setForm] = useState({
    name: currentName || '',
    sets: currentSets || '',
    reps: currentReps || '',
    plannedWeight: currentWeight || '',
  });
  const { save, isPending } = useEditExercise(workoutId, exerciseId);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <View className="flex-1 bg-slate-950">
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">Edit Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-base mb-2 text-slate-300">Exercise Name *</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-base mb-2 text-slate-300">Sets</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          value={form.sets}
          onChangeText={updateField('sets')}
          keyboardType="numeric"
          placeholder="e.g., 4"
          placeholderTextColor="#64748B"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-base mb-2 text-slate-300">Reps</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          value={form.reps}
          onChangeText={updateField('reps')}
          keyboardType="numeric"
          placeholder="e.g., 10"
          placeholderTextColor="#64748B"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-base mb-2 text-slate-300">Planned Weight (kg)</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          value={form.plannedWeight}
          onChangeText={updateField('plannedWeight')}
          keyboardType="decimal-pad"
          placeholder="e.g., 80"
          placeholderTextColor="#64748B"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center mb-8 ${isPending ? 'opacity-50' : ''}`}
          onPress={() => save(form)}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
