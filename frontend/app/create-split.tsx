import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {useSplits} from "@/hooks/useSplits";

export default function CreateSplitModal() {
  const [name, setName] = useState('');
  const router = useRouter();
  const {createSplit, isCreating} = useSplits();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">New Split</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Form */}
      <View className="p-6">
        <Text className="text-base mb-2 text-gray-700">Split Name</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., PPL Split, Upper/Lower"
          value={name}
          onChangeText={setName}
          autoFocus
          editable={!isCreating}
        />

        <TouchableOpacity
          className={`bg-blue-500 rounded-lg py-4 items-center ${
            isCreating ? 'opacity-50' : ''
          }`}
          onPress={() => {
            if (!name.trim()) {
              Alert.alert('Error', 'Please enter a name');
              return;
            }
            createSplit.mutate(name.trim(), {
              onSuccess: () => router.back(),
            });
          }}
          disabled={isCreating}
        >
          <Text className="text-white text-lg font-semibold">
            {isCreating ? 'Creating...' : 'Create Split'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}