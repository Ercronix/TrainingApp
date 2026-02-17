import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '@/services/api';

export default function CreateWorkoutModal() {
  const { splitId } = useLocalSearchParams<{ splitId: string }>();
  const [name, setName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');

  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => workoutsApi.create(Number(splitId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
      Alert.alert('Success', 'Workout created!');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to create workout');
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }

    const data = {
      name: name.trim(),
      sets: sets ? parseInt(sets) : null,
      reps: reps ? parseInt(reps) : null,
      plannedWeight: weight ? parseFloat(weight) : null,
    };

    createMutation.mutate(data);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">New Workout</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Form */}
      <ScrollView className="flex-1 p-6">
        {/* Name */}
        <Text className="text-base mb-2 text-gray-700">Workout Name *</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., Dips, Push ups, Squats"
          value={name}
          onChangeText={setName}
          autoFocus
          editable={!createMutation.isPending}
        />

        {/* Sets */}
        <Text className="text-base mb-2 text-gray-700">Sets</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 5"
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
          editable={!createMutation.isPending}
        />

        {/* Reps */}
        <Text className="text-base mb-2 text-gray-700">Reps</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 10"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          editable={!createMutation.isPending}
        />

        {/* Weight */}
        <Text className="text-base mb-2 text-gray-700">Planned Weight (kg)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., 15.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          editable={!createMutation.isPending}
        />

        {/* Create Button */}
        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center ${
            createMutation.isPending ? 'opacity-50' : ''
          }`}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {createMutation.isPending ? 'Creating...' : 'Create Workout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}