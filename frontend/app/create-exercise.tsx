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
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">New Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Name */}
        <Text className="text-base mb-2 text-gray-700">Exercise Name *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., Bench Press, Squat, Pull-up"
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          editable={!isPending}
        />

        {/* Sets */}
        <Text className="text-base mb-2 text-gray-700">Sets</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 4"
          value={form.sets}
          onChangeText={updateField('sets')}
          keyboardType="numeric"
          editable={!isPending}
        />

        {/* Reps */}
        <Text className="text-base mb-2 text-gray-700">Reps</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 10"
          value={form.reps}
          onChangeText={updateField('reps')}
          keyboardType="numeric"
          editable={!isPending}
        />

        {/* Weight */}
        <Text className="text-base mb-2 text-gray-700">Planned Weight (kg)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 80"
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          editable={!isPending}
        />

        {/* Video URL */}
        <Text className="text-base mb-2 text-gray-700">YouTube Video URL</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., https://youtube.com/watch?v=..."
          value={form.videoUrl}
          onChangeText={updateField('videoUrl')}
          keyboardType="url"
          autoCapitalize="none"
          editable={!isPending}
        />

        {/* Description */}
        <Text className="text-base mb-2 text-gray-700">Description / Notes</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., Keep elbows tucked, full range of motion"
          value={form.description}
          onChangeText={updateField('description')}
          multiline
          numberOfLines={3}
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center mb-8 ${isPending ? 'opacity-50' : ''}`}
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