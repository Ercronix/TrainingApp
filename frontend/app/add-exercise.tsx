import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAddExerciseLog } from '@/hooks/useAddExerciseLog';
import { Ionicons } from '@expo/vector-icons';

export default function AddExerciseScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const { addExerciseLog, isPending } = useAddExerciseLog(trainingLogId);

  if (!trainingLogId) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e] p-6">
        <Text className="text-[#4a4a4a] text-base mb-4">Missing training session.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-[#cafd00] text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [form, setForm] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
  });

  const [addToWorkout, setAddToWorkout] = useState(true);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter an exercise name');
      return;
    }

    addExerciseLog.mutate({
      name: form.name.trim(),
      sets: form.sets ? parseInt(form.sets) : null,
      reps: form.reps ? parseInt(form.reps) : null,
      plannedWeight: form.weight ? parseFloat(form.weight) : null,
      addToWorkout,
    });
  };

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="pt-14 pb-5 px-6">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} disabled={isPending}>
            <Ionicons name="arrow-back" size={20} color={isPending ? '#3a3a3a' : '#cafd00'} />
          </TouchableOpacity>
          <View>
            <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1 text-center">ACTIVE SESSION</Text>
            <Text className="text-[22px] font-bold tracking-tight text-[#f5f5f5] text-center">ADD EXERCISE</Text>
          </View>
          <View className="w-5" />
        </View>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Scope */}
        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">WHERE SHOULD THIS GO?</Text>
        <View className="flex-row mb-6 bg-[#131313] border border-[#1a1a1a] rounded-md overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${addToWorkout ? 'bg-[#cafd00]' : ''}`}
            onPress={() => setAddToWorkout(true)}
            disabled={isPending}
          >
            <Text className={`text-[12px] font-bold tracking-wider ${addToWorkout ? 'text-[#0e0e0e]' : 'text-[#f5f5f5]'}`}>
              ADD TO WORKOUT
            </Text>
            <Text className={`text-[10px] mt-1 ${addToWorkout ? 'text-[#0e0e0e]/60' : 'text-[#4a4a4a]'}`}>
              Also next time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center ${!addToWorkout ? 'bg-[#cafd00]' : ''}`}
            onPress={() => setAddToWorkout(false)}
            disabled={isPending}
          >
            <Text className={`text-[12px] font-bold tracking-wider ${!addToWorkout ? 'text-[#0e0e0e]' : 'text-[#f5f5f5]'}`}>
              ONLY THIS SESSION
            </Text>
            <Text className={`text-[10px] mt-1 ${!addToWorkout ? 'text-[#0e0e0e]/60' : 'text-[#4a4a4a]'}`}>
              Temporary (won't save)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">EXERCISE NAME *</Text>
        <TextInput
          className="bg-[#131313] border border-[#1a1a1a] text-[#f5f5f5] rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., Cable Fly, Dips"
          placeholderTextColor="#3a3a3a"
          value={form.name}
          onChangeText={updateField('name')}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Sets */}
        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">SETS</Text>
        <TextInput
          className="bg-[#131313] border border-[#1a1a1a] text-[#f5f5f5] rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., 3"
          placeholderTextColor="#3a3a3a"
          value={form.sets}
          onChangeText={updateField('sets')}
          keyboardType="numeric"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Reps */}
        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">REPS</Text>
        <TextInput
          className="bg-[#131313] border border-[#1a1a1a] text-[#f5f5f5] rounded-md px-4 py-3 text-base mb-4"
          placeholder="e.g., 12"
          placeholderTextColor="#3a3a3a"
          value={form.reps}
          onChangeText={updateField('reps')}
          keyboardType="numeric"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        {/* Weight */}
        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">PLANNED WEIGHT (KG)</Text>
        <TextInput
          className="bg-[#131313] border border-[#1a1a1a] text-[#f5f5f5] rounded-md px-4 py-3 text-base mb-6"
          placeholder="e.g., 25"
          placeholderTextColor="#3a3a3a"
          value={form.weight}
          onChangeText={updateField('weight')}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-4 flex-row items-center justify-center gap-2 mb-10 ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={handleAdd}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#0e0e0e" />
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">{isPending ? 'ADDING...' : 'ADD EXERCISE'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
