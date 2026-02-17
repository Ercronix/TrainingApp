import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {useCreateWorkout} from "@/hooks/useCreateWorkout";

export default function CreateWorkoutModal() {
  const { splitId } = useLocalSearchParams<{ splitId: string }>();
  const [form, setForm] = useState({ name: '', sets: '', reps: '', weight: '' });
  const { createWorkout, isPending } = useCreateWorkout(splitId);

  const router = useRouter();

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

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
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          editable={!isPending}
        />

        {/* Sets */}
        <Text className="text-base mb-2 text-gray-700">Sets</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-4"
          placeholder="e.g., 5"
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
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., 15.5"
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          editable={!isPending}
        />

        {/* Create Button */}
        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center ${ isPending ? 'opacity-50' : ''
          }`}
          onPress={() => createWorkout(form)}
          disabled={isPending}
        >
          <Text className="text-white text-lg font-semibold">
            {isPending ? 'Creating...' : 'Create Workout'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}