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
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">New Workout Day</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Form */}
      <View className="p-6">
        <Text className="text-sm text-gray-500 mb-4">
          A workout day groups exercises together — e.g. "Push Day", "Leg Day", "Pull Day".
          You can add individual exercises with sets, reps and videos after creating it.
        </Text>

        <Text className="text-base mb-2 text-gray-700">Workout Name *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., Push Day, Leg Day, Pull Day"
          value={name}
          onChangeText={setName}
          autoFocus
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
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