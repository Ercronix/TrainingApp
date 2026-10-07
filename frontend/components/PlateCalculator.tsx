import { View, Text } from 'react-native';
import { calculatePlates, formatKg } from '@/utils/strength';

// Plates are labelled exactly (1.25, not 1.3)
const formatPlate = (kg: number) => String(kg);

interface Props {
  weight: string;
}

// Bigger plates are taller and thicker; colors loosely follow competition plates
const PLATE_STYLE: Record<number, { height: number; width: number; className: string }> = {
  25: { height: 44, width: 10, className: 'bg-danger' },
  20: { height: 44, width: 10, className: 'bg-info' },
  15: { height: 38, width: 9, className: 'bg-accent' },
  10: { height: 32, width: 8, className: 'bg-primary' },
  5: { height: 24, width: 7, className: 'bg-muted' },
  2.5: { height: 18, width: 6, className: 'bg-muted' },
  1.25: { height: 14, width: 5, className: 'bg-muted' },
};

/** One side of the bar, loaded with the plates for a total weight. */
export function PlateCalculator({ weight }: Props) {
  const total = parseFloat(weight.replace(',', '.'));
  const result = calculatePlates(total);
  if (!result || result.perSide.length === 0) return null;

  return (
    <View className="gap-1">
      <View className="flex-row items-center gap-3">
        <View className="flex-row items-center gap-0.5" accessible={false}>
          <View className="w-8 h-1 rounded-full bg-subtle" />
          {result.perSide.map((plate, i) => {
            const style = PLATE_STYLE[plate];
            return (
              <View key={i} className={`rounded-sm ${style.className}`} style={{ height: style.height, width: style.width }} />
            );
          })}
          <View className="w-3 h-1 rounded-full bg-subtle" />
        </View>
        <Text className="flex-1 text-primary text-xs font-mono-bold">
          {result.perSide.map(formatPlate).join(' + ')}
          <Text className="text-muted font-mono"> / side</Text>
        </Text>
      </View>
      {result.remainder > 0 && (
        <Text className="text-muted text-[10px]">
          +{formatKg(result.remainder)} kg can&apos;t be loaded with standard plates
        </Text>
      )}
    </View>
  );
}
