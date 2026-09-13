import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useExerciseLog } from '@/hooks/useExerciseLog';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import KeyboardAvoidingWrapper from '@/components/KeyboardAvoidingWrapper';

export default function LogExerciseModal() {
  const {
    exerciseLogId, exerciseName, plannedSets, plannedReps, plannedWeight, trainingLogId, repUnit,
  } = useLocalSearchParams<{
    exerciseLogId: string; exerciseName: string; plannedSets: string;
    plannedReps: string; plannedWeight: string; trainingLogId: string; repUnit: string;
  }>();

  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(plannedWeight || '');
  const router = useRouter();
  const { saveExercise, isPending } = useExerciseLog(exerciseLogId, trainingLogId);
  const c = useTheme();

  return (
    <View className="flex-1 bg-base">
      <KeyboardAvoidingWrapper>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={c.muted} />
        </TouchableOpacity>
        <Text className="text-muted text-[10px] tracking-[4px]">LOG EXERCISE</Text>
        <View className="w-6" />
      </View>

      <View className="flex-1 px-6">
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9 mb-4">
          {exerciseName}
        </Text>

        {plannedSets && plannedReps && (
          <View className="bg-accent/10 rounded-sm px-3 py-2 mb-6 self-start">
            <Text className="text-accent-text text-[11px] tracking-widest">
              TARGET: {plannedSets} × {plannedReps} {repUnit === 'seconds' ? 'sec' : 'reps'}{plannedWeight ? ` @ ${plannedWeight} kg` : ''}
            </Text>
          </View>
        )}

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">SETS COMPLETED</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-2xl font-bold tracking-tight mb-5"
          placeholder={plannedSets || '4'}
          placeholderTextColor={c.elevated}
          value={sets}
          onChangeText={setSets}
          keyboardType="numeric"
          keyboardAppearance="dark"
        />

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">{repUnit === 'seconds' ? 'SECONDS PER SET' : 'REPS PER SET'}</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-2xl font-bold tracking-tight mb-5"
          placeholder={plannedReps || '10'}
          placeholderTextColor={c.elevated}
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
          keyboardAppearance="dark"
        />

        <Text className="text-muted text-[9px] tracking-[3px] mb-2">WEIGHT USED (KG)</Text>
        <TextInput
          className="bg-surface rounded px-4 py-4 text-primary text-2xl font-bold tracking-tight mb-6"
          placeholder={plannedWeight || '0'}
          placeholderTextColor={c.elevated}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          keyboardAppearance="dark"
        />

        <TouchableOpacity
          className={`bg-accent rounded-md py-5 flex-row items-center justify-center gap-2 ${isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => saveExercise(sets, reps, weight)}
          disabled={isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isPending ? 'SAVING...' : 'SAVE & COMPLETE'}
          </Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingWrapper>
    </View>
  );
}
