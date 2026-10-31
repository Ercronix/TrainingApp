import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useStretchRoutine } from '@/hooks/useStretchRoutine';
import { alert } from '@/utils/confirm';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';
import { Tactile } from '@/components/Tactile';

export default function EditStretchRoutineModal() {
  const { currentName } = useLocalSearchParams<{ currentName: string }>();
  const router = useRouter();
  const [name, setName] = useState(currentName || '');
  const { renameRoutine } = useStretchRoutine();
  const isPending = renameRoutine.isPending;
  const c = useTheme();

  const save = () => {
    if (!name.trim()) {
      alert('Error', 'Please enter a name');
      return;
    }
    renameRoutine.mutate(name.trim(), { onSuccess: () => router.back() });
  };

  return (
    <View className="flex-1 bg-base">
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Close">
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">EDIT ROUTINE</Text>
        <View className="w-6" />
      </View>

      <KeyboardAvoidingWrapper scroll={false}>
      <View className="flex-1 px-6">
        <Text className="text-primary text-[40px] font-bold tracking-tighter leading-[44px] mb-8">
          RENAME{'\n'}ROUTINE
        </Text>

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">ROUTINE NAME</Text>
        <TextInput
          className="bg-surface border-2 border-edge border-b-4 rounded px-4 py-4 text-primary text-xl font-bold tracking-tight mb-6"
          value={name}
          onChangeText={setName}
          placeholder="Evening stretch"
          placeholderTextColor={c.elevated}
          maxLength={100}
          autoFocus
          keyboardAppearance={c.keyboardAppearance}
          editable={!isPending}
          onSubmitEditing={save}
        />

        <Tactile
          className={`rounded-md py-5 items-center ${isPending ? 'opacity-50' : ''}`}
          onPress={save}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </Text>
        </Tactile>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
