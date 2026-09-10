import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreateWorkout } from '@/hooks/useCreateWorkout';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/constants/theme';

export default function CreateWorkoutModal() {
  const colors = useThemeColors();
  const { splitId } = useLocalSearchParams<{ splitId: string }>();
  const [name, setName] = useState('');
  const { createWorkout, isPending } = useCreateWorkout(splitId);
  const router = useRouter();

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={colors.inkMuted} />
        </TouchableOpacity>
        <Text className="text-ink-muted dark:text-ink-muted-dark text-[10px] tracking-[4px]">NEW WORKOUT DAY</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-ink dark:text-ink-dark text-[40px] font-bold tracking-tighter leading-[44px] mb-2">
          NAME THIS{'\n'}DAY
        </Text>
        <Text className="text-ink-subtle dark:text-ink-subtle-dark text-sm mb-8">Push Day, Leg Day, Pull Day...</Text>

        <Text className="text-ink-muted dark:text-ink-muted-dark text-[9px] tracking-[3px] mb-2">WORKOUT NAME</Text>
        <TextInput
          className="bg-surface dark:bg-surface-dark rounded px-4 py-4 text-ink dark:text-ink-dark text-xl font-bold tracking-tight mb-6"
          placeholder="Push Day"
          placeholderTextColor={colors.inkHint}
          value={name}
          onChangeText={setName}
          autoFocus
          keyboardAppearance="dark"
          editable={!isPending}
        />

        <TouchableOpacity
          className={`bg-accent-solid rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: colors.accentSolid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => createWorkout(name)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-accent-ink text-sm font-bold tracking-[2px]">
            {isPending ? 'CREATING...' : 'CREATE WORKOUT'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
