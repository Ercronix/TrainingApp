import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import {useSplits} from "@/hooks/useSplits";

export default function CreateSplitModal() {
  const [name, setName] = useState('');
  const router = useRouter();
  const {createSplit, isCreating} = useSplits();

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-100">New Split</Text>
          <View className="w-16" />
        </View>
      </View>

      {/* Form */}
      <View className="p-6">
        <Text className="text-base mb-2 text-slate-300">Split Name</Text>
        <TextInput
          className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 text-base mb-6"
          placeholder="e.g., PPL Split, Upper/Lower"
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isCreating}
        />

        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center ${
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
