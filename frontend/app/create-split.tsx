import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSplits } from '@/hooks/useSplits';
import { Ionicons } from '@expo/vector-icons';

export default function CreateSplitModal() {
  const [name, setName] = useState('');
  const router = useRouter();
  const { createSplit, isCreating } = useSplits();

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#4a4a4a" />
        </TouchableOpacity>
        <Text className="text-[#4a4a4a] text-[10px] tracking-[4px]">NEW SPLIT</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-[#f5f5f5] text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
          NAME YOUR{'\n'}SPLIT
        </Text>

        <Text className="text-[#4a4a4a] text-[9px] tracking-[3px] mb-2">SPLIT NAME</Text>
        <TextInput
          className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight mb-6"
          placeholder="PPL, Upper/Lower..."
          placeholderTextColor="#2a2a2a"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isCreating}
        />

        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-5 items-center ${isCreating ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => {
            if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
            createSplit.mutate(name.trim(), { onSuccess: () => router.back() });
          }}
          disabled={isCreating}
          activeOpacity={0.85}
        >
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {isCreating ? 'CREATING...' : 'CREATE SPLIT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
