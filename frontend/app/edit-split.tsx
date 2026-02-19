import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEditSplit } from '@/hooks/useEditSplit';

export default function EditSplitModal() {
  const { splitId, currentName } = useLocalSearchParams<{
    splitId: string;
    currentName: string;
  }>();
  const router = useRouter();
  const [name, setName] = useState(currentName || '');
  const { save, isPending } = useEditSplit(splitId);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Edit Split</Text>
          <View className="w-16" />
        </View>
      </View>

      <View className="p-6">
        <Text className="text-base mb-2 text-gray-700">Split Name</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          value={name}
          onChangeText={setName}
          autoFocus
          editable={!isPending}
        />
        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center ${isPending ? 'opacity-50' : ''}`}
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