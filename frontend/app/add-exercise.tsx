import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAddExerciseLog } from '@/hooks/useAddExerciseLog';

export default function AddExerciseScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const { addExerciseLog, isPending } = useAddExerciseLog(trainingLogId);

  if (!trainingLogId) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950 p-6">
        <Text className="text-slate-300 text-base mb-4">Missing training session.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-blue-400 text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [form, setForm] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
  });

  const [addToWorkout, setAddToWorkout] = useState(true);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    addExerciseLog.mutate({
      name: form.name.trim(),
      sets: form.sets ? parseInt(form.sets) : null,
      reps: form.reps ? parseInt(form.reps) : null,
      plannedWeight: form.weight ? parseFloat(form.weight) : null,
      addToWorkout,
    });
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()} disabled={isPending}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">Add Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Scope */}
        <Text className="text-base mb-2 text-slate-300">Add Where</Text>
        <View className="flex-row mb-6 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${addToWorkout ? 'bg-blue-700' : ''}`}
            onPress={() => setAddToWorkout(true)}
            disabled={isPending}
          >
            <Text className={`text-sm font-semibold ${addToWorkout ? 'text-white' : 'text-slate-200'}`}>
              Add to Workout
            </Text>
            <Text className={`text-xs mt-1 ${addToWorkout ? 'text-blue-100' : 'text-slate-400'}`}>
              Also next time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${!addToWorkout ? 'bg-blue-700' : ''}`}
            onPress={() => setAddToWorkout(false)}
            disabled={isPending}
          >
            <Text className={`text-sm font-semibold ${!addToWorkout ? 'text-white' : 'text-slate-200'}`}>
              Only This Training
            </Text>
            <Text className={`text-xs mt-1 ${!addToWorkout ? 'text-blue-100' : 'text-slate-400'}`}>
              One-off log
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text className="text-base mb-2 text-slate-300">Exercise Name *</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., Cable Fly, Dips"
          placeholderTextColor="#64748B"
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Sets */}
        <Text className="text-base mb-2 text-slate-300">Sets</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 3"
          placeholderTextColor="#64748B"
          value={form.sets}
          onChangeText={updateField('sets')}
          keyboardType="numeric"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Reps */}
        <Text className="text-base mb-2 text-slate-300">Reps</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 12"
          placeholderTextColor="#64748B"
          value={form.reps}
          onChangeText={updateField('reps')}
          keyboardType="numeric"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Weight */}
        <Text className="text-base mb-2 text-slate-300">Planned Weight (kg)</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., 25"
          placeholderTextColor="#64748B"
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center mb-8 ${isPending ? 'opacity-50' : ''}`}
          onPress={handleAdd}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Adding...' : 'Add Exercise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
