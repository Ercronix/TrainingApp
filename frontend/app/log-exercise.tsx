import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExerciseLog } from '@/hooks/useExerciseLog';

export default function LogExerciseModal() {
  const {
    exerciseLogId,
    exerciseName,
    plannedSets,
    plannedReps,
    plannedWeight,
    trainingLogId,
  } = useLocalSearchParams<{
    exerciseLogId: string;
    exerciseName: string;
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
    <View className="flex-1 bg-slate-950">
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">Log Exercise</Text>
          <View className="w-16" />
        </View>
      </View>

      <View className="p-6">
        <Text className="text-2xl font-bold text-slate-100 mb-6">{exerciseName}</Text>

        {plannedSets && plannedReps && (
          <View className="bg-blue-950/40 border border-blue-900/50 rounded-lg p-3 mb-6">
            <Text className="text-sm text-blue-200">
              Planned: {plannedSets} × {plannedReps} reps
              {plannedWeight ? ` @ ${plannedWeight} kg` : ''}
            </Text>
          </View>
        )}

        <Text className="text-base mb-2 text-slate-300">Sets Completed</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedSets || '4'}
          placeholderTextColor="#64748B"
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
          keyboardAppearance="dark"
        />

        <Text className="text-base mb-2 text-slate-300">Reps per Set</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-4"
          placeholder={plannedReps || '10'}
          placeholderTextColor="#64748B"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          keyboardAppearance="dark"
        />

        <Text className="text-base mb-2 text-slate-300">Weight Used (kg)</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          placeholder={plannedWeight || '0'}
          placeholderTextColor="#64748B"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
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
