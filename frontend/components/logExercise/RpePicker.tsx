import { Text, View } from 'react-native';
import { Tactile } from '@/components/Tactile';
import { parseNumber, RPE_OPTIONS } from '@/utils/logExercise';

/** RPE choices in a row: tap the selected one again to clear it. */
export function RpePicker({ value, onChange }: { value: string; onChange: (rpe: string) => void }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-muted text-[9px] tracking-[2px] w-9">RPE</Text>
      {RPE_OPTIONS.map((option) => {
        const selected = parseNumber(value) === Number(option);
        return (
          <Tactile
            key={option}
            variant={selected ? 'accent' : 'elevated'}
            depth={3}
            containerClassName="flex-1"
            className="h-10 rounded-sm justify-center items-center"
            onPress={() => onChange(selected ? '' : option)}
            accessibilityLabel={selected ? `RPE ${option}, tap to clear` : `RPE ${option}`}
          >
            <Text className={`text-xs font-mono-bold ${selected ? 'text-accent-fg' : 'text-muted'}`}>{option}</Text>
          </Tactile>
        );
      })}
    </View>
  );
}
