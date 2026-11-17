import { View, Text } from 'react-native';
import { MesocycleWeek, formatMesocycleWeek } from '@/utils/mesocycle';

/** Marks a deload session (history, session screens). */
export function DeloadBadge({ label = 'DELOAD' }: { label?: string }) {
  return (
    <View className="border border-accent rounded-sm px-1.5 py-0.5 self-start" accessibilityLabel="Deload session">
      <Text className="text-accent-text text-[9px] font-bold tracking-[1px]">{label}</Text>
    </View>
  );
}

/** "WEEK 3 OF 5", or a badge in the deload week. */
export function MesocycleWeekLabel({ week }: { week: MesocycleWeek }) {
  if (week.deload) return <DeloadBadge label="DELOAD WEEK" />;
  return <Text className="text-accent-text text-[10px] tracking-[2px]">{formatMesocycleWeek(week)}</Text>;
}
