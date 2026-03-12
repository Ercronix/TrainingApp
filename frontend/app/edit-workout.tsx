import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditWorkout } from '@/hooks/useEditWorkout';

export default function EditWorkoutModal() {
  const { workoutId, splitId, currentName } = useLocalSearchParams<{
    workoutId: string;
    splitId: string;
    currentName: string;
  }>();
  const router = useRouter();
  const [name, setName] = useState(currentName || '');
  const { save, isPending } = useEditWorkout(workoutId, splitId);

  return (
    <View className="flex-1 bg-slate-950">
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">Edit Workout</Text>
          <View className="w-16" />
        </View>
      </View>

      <View className="p-6">
        <Text className="text-base mb-2 text-slate-300">Workout Name</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
          onPress={() => save(name)}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
