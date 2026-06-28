import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditSplit } from '@/hooks/useEditSplit';
import { Ionicons } from '@expo/vector-icons';

export default function EditSplitModal() {
  const { splitId, currentName, currentBlock } = useLocalSearchParams<{ splitId: string; currentName: string; currentBlock: string }>();
  const router = useRouter();
  const [name, setName] = useState(currentName || '');
  const [block, setBlock] = useState<number>(parseInt(currentBlock || '1') || 1);
  const { save, isPending } = useEditSplit(splitId);

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#7a7a7a" />
        </TouchableOpacity>
        <Text className="text-[#7a7a7a] text-[10px] tracking-[4px]">EDIT SPLIT</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-[#f5f5f5] text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
          RENAME{'\n'}SPLIT
        </Text>

        <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">SPLIT NAME</Text>
        <TextInput
          className="bg-[#131313] rounded px-4 py-4 text-[#f5f5f5] text-xl font-bold tracking-tight mb-6"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">TRAINING BLOCK</Text>
        <View className="flex-row gap-3 mb-6">
          {[1, 2, 3].map((b) => (
            <TouchableOpacity
              key={b}
              className={`flex-1 py-4 rounded items-center ${block === b ? 'bg-[#cafd00]' : 'bg-[#131313]'}`}
              onPress={() => setBlock(b)}
              disabled={isPending}
            >
              <Text className={`text-sm font-bold tracking-[1px] ${block === b ? 'text-[#0e0e0e]' : 'text-[#7a7a7a]'}`}>{b}</Text>
              <Text className={`text-[8px] tracking-[1px] mt-1 ${block === b ? 'text-[#0e0e0e]' : 'text-[#3a3a3a]'}`}>
                {b === 1 ? 'HYPERTROPHY' : b === 2 ? 'STRENGTH' : 'POWER'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => save(name, block)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
