import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';

export default function ExerciseDetailModal() {
  const { exerciseLogId, workoutName, plannedSets, plannedReps, plannedWeight, trainingLogId } =
    useLocalSearchParams<{
      exerciseLogId: string;
      workoutName: string;
      plannedSets: string;
      plannedReps: string;
      plannedWeight: string;
      trainingLogId: string;
    }>();

  const [setsCompleted, setSetsCompleted] = useState('');
  const [repsCompleted, setRepsCompleted] = useState('');
  const [weightUsed, setWeightUsed] = useState(plannedWeight || '');

  const router = useRouter();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      trainingLogsApi.updateExercise(Number(exerciseLogId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', trainingLogId] });
      Alert.alert('Success', 'Exercise updated!');
      router.back();
    },
  });

  const handleSave = () => {
    const data = {
      setsCompleted: setsCompleted ? parseInt(setsCompleted) : 0,
      repsCompleted: repsCompleted ? parseInt(repsCompleted) : 0,
      weightUsed: weightUsed ? parseFloat(weightUsed) : null,
      completed: true,
    };

    updateMutation.mutate(data);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Log Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <View className="p-6">
        {/* Exercise Name */}
        <Text className="text-2xl font-bold text-gray-800 mb-6">
          {workoutName}
        </Text>

        {/* Planned Info */}
        {plannedSets && plannedReps && (
          <View className="bg-blue-50 rounded-lg p-3 mb-6">
            <Text className="text-sm text-blue-800">
              📋 Planned: {plannedSets} × {plannedReps} reps @ {plannedWeight || '0'} kg
            </Text>
          </View>
        )}

        {/* Sets Completed */}
        <Text className="text-base mb-2 text-gray-700">Sets Completed</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedSets || '5'}
          value={setsCompleted}
          onChangeText={setSetsCompleted}
          keyboardType="numeric"
        />

        {/* Reps Completed */}
        <Text className="text-base mb-2 text-gray-700">Reps per Set</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedReps || '10'}
          value={repsCompleted}
          onChangeText={setRepsCompleted}
          keyboardType="numeric"
        />

        {/* Weight Used */}
        <Text className="text-base mb-2 text-gray-700">Weight Used (kg)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder={plannedWeight || '0'}
          value={weightUsed}
          onChangeText={setWeightUsed}
          keyboardType="decimal-pad"
        />

        {/* Save Button */}
        <TouchableOpacity
          className={`bg-green-500 rounded-lg py-4 items-center ${
            updateMutation.isPending ? 'opacity-50' : ''
          }`}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {updateMutation.isPending ? 'Saving...' : 'Save & Mark Complete ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}