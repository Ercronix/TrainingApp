import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditExercise } from '@/hooks/useEditExercise';
import { Ionicons } from '@expo/vector-icons';

export default function EditExerciseModal() {
  const { workoutId, exerciseId, currentName, currentSets, currentReps, currentWeight } =
    useLocalSearchParams<{
      workoutId: string; exerciseId: string; currentName: string;
      currentSets: string; currentReps: string; currentWeight: string;
    }>();

  const router = useRouter();
  const [form, setForm] = useState({
    name: currentName || '', sets: currentSets || '',
    reps: currentReps || '', plannedWeight: currentWeight || '',
  });
  const { save, isPending } = useEditExercise(workoutId, exerciseId);
  const updateField = (field: keyof typeof form) => (value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#4a4a4a" />
        </TouchableOpacity>
        <Text className="text-[#4a4a4a] text-[10px] tracking-[4px]">EDIT EXERCISE</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <Text className="text-[#f5f5f5] text-[36px] font-bold tracking-tighter leading-10 mb-8">
          EDIT{'\n'}EXERCISE
        </Text>

        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">EXERCISE NAME *</Text>
        <TextInput
          className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-[22px] font-bold tracking-tight mb-5"
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1">
            <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">SETS</Text>
            <TextInput
              className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-lg font-bold tracking-tight"
              value={form.sets}
              onChangeText={updateField('sets')}
              keyboardType="numeric"
              placeholder="4"
              placeholderTextColor="#2a2a2a"
              keyboardAppearance="dark"
              editable={!isPending}
            />
          </View>
          <View className="flex-1">
            <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">REPS</Text>
            <TextInput
              className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-lg font-bold tracking-tight"
              value={form.reps}
              onChangeText={updateField('reps')}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#2a2a2a"
              keyboardAppearance="dark"
              editable={!isPending}
            />
          </View>
        </View>

        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">TARGET WEIGHT (KG)</Text>
        <TextInput
          className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-lg font-bold tracking-tight mb-6"
          value={form.plannedWeight}
          onChangeText={updateField('plannedWeight')}
          keyboardType="decimal-pad"
          placeholder="80"
          placeholderTextColor="#2a2a2a"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => save(form)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
