import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreateWorkout } from '@/hooks/useCreateWorkout';
import { Ionicons } from '@expo/vector-icons';

export default function CreateWorkoutModal() {
  const { splitId } = useLocalSearchParams<{ splitId: string }>();
  const [name, setName] = useState('');
  const { createWorkout, isPending } = useCreateWorkout(splitId);
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#7a7a7a" />
        </TouchableOpacity>
        <Text className="text-[#7a7a7a] text-[10px] tracking-[4px]">NEW WORKOUT DAY</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-[#f5f5f5] text-[40px] font-bold tracking-tighter leading-[44px] mb-2">
          NAME THIS{'\n'}DAY
        </Text>
        <Text className="text-[#3a3a3a] text-sm mb-8">Push Day, Leg Day, Pull Day...</Text>

        <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">WORKOUT NAME</Text>
        <TextInput
          className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight mb-6"
          placeholder="Push Day"
          placeholderTextColor="#2a2a2a"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => createWorkout(name)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {isPending ? 'CREATING...' : 'CREATE WORKOUT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
