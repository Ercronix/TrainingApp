import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExercises } from '@/hooks/useExercises';

export default function CreateExerciseModal() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const router = useRouter();
  const { createExercise } = useExercises(workoutId);

  const [form, setForm] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    videoUrl: '',
    description: '',
  });

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isPending = createExercise.isPending;

  const handleCreate = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }
    createExercise.mutate(
      {
        name: form.name.trim(),
        sets: form.sets ? parseInt(form.sets) : null,
        reps: form.reps ? parseInt(form.reps) : null,
        plannedWeight: form.weight ? parseFloat(form.weight) : null,
        videoUrl: form.videoUrl.trim() || null,
        description: form.description.trim() || null,
      },
      { onSuccess: () => router.back() }
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">New Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Name */}
        <Text className="text-base mb-2 text-slate-300">Exercise Name *</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., Bench Press, Squat, Pull-up"
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
          placeholder="e.g., 4"
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
          placeholder="e.g., 10"
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
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 80"
          placeholderTextColor="#64748B"
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Video URL */}
        <Text className="text-base mb-2 text-slate-300">YouTube Video URL</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., https://youtube.com/watch?v=..."
          placeholderTextColor="#64748B"
          value={form.videoUrl}
          onChangeText={updateField('videoUrl')}
          keyboardType="url"
          autoCapitalize="none"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Description */}
        <Text className="text-base mb-2 text-slate-300">Description / Notes</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., Keep elbows tucked, full range of motion"
          placeholderTextColor="#64748B"
          value={form.description}
          onChangeText={updateField('description')}
          multiline
          numberOfLines={3}
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center mb-8 ${isPending ? 'opacity-50' : ''}`}
          onPress={handleCreate}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Creating...' : 'Add Exercise'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
