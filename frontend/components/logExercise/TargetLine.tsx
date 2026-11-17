import { Text, View } from 'react-native';
import { formatTarget, Target } from '@/utils/logExercise';

/** What the exercise aims for, e.g. "TARGET: 3 × 8 reps @ 60 kg". */
export function TargetLine({ target, unitShort }: { target: Target; unitShort: string }) {
  return (
    <View className="bg-accent-muted rounded-sm px-3 py-2">
      <Text className="text-accent-text text-[11px] tracking-widest">{formatTarget(target, unitShort)}</Text>
    </View>
  );
}
