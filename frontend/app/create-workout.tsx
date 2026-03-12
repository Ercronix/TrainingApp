import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreateWorkout } from '@/hooks/useCreateWorkout';

export default function CreateWorkoutModal() {
  const { splitId } = useLocalSearchParams<{ splitId: string }>();
  const [name, setName] = useState('');
  const { createWorkout, isPending } = useCreateWorkout(splitId);
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">New Workout Day</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Form */}
      <View className="p-6">
        <Text className="text-sm text-slate-400 mb-4">
          A workout day groups exercises together — e.g. "Push Day", "Leg Day", "Pull Day".
          You can add individual exercises with sets, reps and videos after creating it.
        </Text>

        <Text className="text-base mb-2 text-slate-300">Workout Name *</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., Push Day, Leg Day, Pull Day"
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
          onPress={() => createWorkout(name)}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Creating...' : 'Create Workout'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
