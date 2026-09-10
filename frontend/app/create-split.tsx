import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSplits } from '@/hooks/useSplits';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/theme';

export default function CreateSplitModal() {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const router = useRouter();
  const { createSplit, isCreating } = useSplits();

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.inkMuted} />
        </TouchableOpacity>
        <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[4px]">NEW SPLIT</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-ink dark:text-ink-dark text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
          NAME YOUR{'\n'}SPLIT
        </Text>

        <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">SPLIT NAME</Text>
        <TextInput
          className="bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight mb-6"
          placeholder="PPL, Upper/Lower..."
          placeholderTextColor={colors.inkHint}
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isCreating}
        />

        <TouchableOpacity
          className={`bg-accent-solid rounded-md py-5 items-center ${isCreating ? 'opacity-50' : ''}`}
          style={{ shadowColor: colors.accentSolid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => {
            if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
            createSplit.mutate(name.trim(), { onSuccess: () => router.back() });
          }}
          disabled={isCreating}
          activeOpacity={0.85}
        >
          <Text className="text-accent-ink text-sm font-bold tracking-[2px]">
            {isCreating ? 'CREATING...' : 'CREATE SPLIT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
