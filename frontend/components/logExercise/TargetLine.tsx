import { Text, View } from 'react-native';
import { formatTarget, Target } from '@/utils/logExercise';
import { formatSuggestion, Suggestion } from '@/utils/progression';

/**
 * What the exercise aims for: the plan, e.g. "PLAN: 3 × 8–12 reps @ 60 kg", and the suggested
 * next target after last session with its reason, e.g. "NEXT: 62.5 kg × 8 reps".
 */
export function TargetLine({ target, suggestion, unitShort }: {
  target: Target | null;
  suggestion: Suggestion | null;
  unitShort: string;
}) {
  if (!target && !suggestion) return null;
  return (
    <View className="bg-accent-muted rounded-sm px-3 py-2 gap-1 flex-shrink">
      {target && <Text className="text-accent-text text-[11px] tracking-widest">{formatTarget(target, unitShort)}</Text>}
      {suggestion && (
        <View accessible accessibilityLabel={`${formatSuggestion(suggestion, unitShort)}. ${suggestion.reason}`}>
          <Text className="text-primary text-[11px] font-bold tracking-widest">{formatSuggestion(suggestion, unitShort)}</Text>
          <Text className="text-muted text-[11px] mt-0.5">{suggestion.reason}</Text>
        </View>
      )}
    </View>
  );
}
