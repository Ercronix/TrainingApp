import { Text, View } from 'react-native';
import { SetRow } from '@/store/setDraftStore';

/** Set number in a circle: filled once done, grey for warm-ups. */
export function SetNumberBadge({ row, label }: { row: SetRow; label: string }) {
  return (
    <View className={`w-8 h-8 rounded-full justify-center items-center ${row.done ? 'bg-accent' : row.warmup ? 'bg-elevated' : 'bg-accent-muted'}`}>
      <Text className={`text-sm font-bold ${row.done ? 'text-accent-fg' : row.warmup ? 'text-muted' : 'text-accent-text'}`}>
        {label}
      </Text>
    </View>
  );
}
