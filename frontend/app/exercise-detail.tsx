import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExerciseLog } from '@/hooks/useExerciseLog';

export default function ExerciseDetailModal() {
  const {
    exerciseLogId,
    workoutName,
    plannedSets,
    plannedReps,
    plannedWeight,
    trainingLogId,
  } = useLocalSearchParams<{
    exerciseLogId: string;
    workoutName: string;
    plannedSets: string;
    plannedReps: string;
    plannedWeight: string;
    trainingLogId: string;
  }>();

  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(plannedWeight || '');

  const router = useRouter();
  const { saveExercise, isPending } = useExerciseLog(exerciseLogId, trainingLogId);

  return (
    <View className="flex-1 bg-gray-50">
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
        <Text className="text-2xl font-bold text-gray-800 mb-6">{workoutName}</Text>

        {plannedSets && plannedReps && (
          <View className="bg-blue-50 rounded-lg p-3 mb-6">
            <Text className="text-sm text-blue-800">
              Planned: {plannedSets} × {plannedReps} reps @ {plannedWeight || '0'} kg
            </Text>
          </View>
        )}

        <Text className="text-base mb-2 text-gray-700">Sets Completed</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedSets || '5'}
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
        />

        <Text className="text-base mb-2 text-gray-700">Reps per Set</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedReps || '10'}
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
        />

        <Text className="text-base mb-2 text-gray-700">Weight Used (kg)</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder={plannedWeight || '0'}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity
          className={`bg-green-500 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
          onPress={() => saveExercise(sets, reps, weight)}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Saving...' : 'Save & Mark Complete ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}