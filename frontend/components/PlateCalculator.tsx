import { View, Text } from 'react-native';
import { calculatePlates, formatKg, BAR_WEIGHT_KG } from '@/utils/strength';

interface Props {
  weight: string;
}

export function PlateCalculator({ weight }: Props) {
  const total = parseFloat(weight.replace(',', '.'));
  const result = calculatePlates(total);
  if (!result || result.perSide.length === 0) return null;

  return (
    <View className="bg-surface rounded px-4 py-3 mb-6">
      <Text className="text-muted text-[9px] tracking-[3px] mb-2">
        PLATES PER SIDE · {BAR_WEIGHT_KG} KG BAR
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {result.perSide.map((plate, i) => (
          <View key={i} className="bg-accent/10 rounded-sm px-2 py-1">
            <Text className="text-accent-text text-xs font-bold">{formatKg(plate)}</Text>
          </View>
        ))}
      </View>
      {result.remainder > 0 && (
        <Text className="text-muted text-[10px] mt-2">
          +{formatKg(result.remainder)} kg can't be loaded with standard plates
        </Text>
      )}
    </View>
  );
}
