import { View, Text } from 'react-native';
import { Muscle, MuscleRole, MuscleTarget } from '@/types';
import { MUSCLE_GROUPS, MUSCLE_LABELS } from '@/constants/muscles';
import { muscleNames, primaryMuscles, secondaryMuscles } from '@/utils/muscles';
import { Tactile } from '@/components/Tactile';
import { useTheme } from '@/hooks/useTheme';

const NEXT_ROLE: Record<'NONE' | MuscleRole, MuscleRole | null> = {
  NONE: 'PRIMARY',
  PRIMARY: 'SECONDARY',
  SECONDARY: null,
};

/** Muscle chips grouped by push, pull, legs and core. A tap cycles primary, secondary and off. */
export function MusclePicker({
  value,
  onChange,
  disabled,
}: {
  value: MuscleTarget[];
  onChange: (muscles: MuscleTarget[]) => void;
  disabled?: boolean;
}) {
  const c = useTheme();
  const roles = new Map(value.map((m) => [m.muscle, m.role]));

  const toggle = (muscle: Muscle) => {
    const next = NEXT_ROLE[roles.get(muscle) ?? 'NONE'];
    const rest = value.filter((m) => m.muscle !== muscle);
    onChange(next ? [...rest, { muscle, role: next }] : rest);
  };

  return (
    <View>
      {MUSCLE_GROUPS.map((group) => (
        <View key={group.label} className="mb-3">
          <Text className="text-subtle text-[8px] tracking-[2px] mb-1.5">{group.label}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {group.muscles.map((muscle) => {
              const role = roles.get(muscle);
              return (
                <Tactile
                  key={muscle}
                  variant={role === 'PRIMARY' ? 'accent' : 'elevated'}
                  depth={3}
                  className="px-3 py-2 rounded-sm"
                  style={role === 'SECONDARY' ? { backgroundColor: c.accentMuted, borderColor: c.accentLip } : undefined}
                  onPress={() => toggle(muscle)}
                  disabled={disabled}
                  accessibilityState={{ selected: role != null }}
                >
                  <Text
                    className={`text-[10px] font-bold tracking-widest ${
                      role === 'PRIMARY' ? 'text-accent-fg' : role === 'SECONDARY' ? 'text-accent-text' : 'text-muted'
                    }`}
                  >
                    {MUSCLE_LABELS[muscle].toUpperCase()}
                  </Text>
                </Tactile>
              );
            })}
          </View>
        </View>
      ))}
      <Text className="text-muted text-[10px]">
        Tap once for a primary muscle (full set), twice for a secondary one (half a set)
      </Text>
    </View>
  );
}

/** One line of text: primary muscles, then secondary ones in a muted tone. */
export function MuscleSummary({ muscles, className = '' }: { muscles: MuscleTarget[]; className?: string }) {
  const primary = primaryMuscles(muscles);
  const secondary = secondaryMuscles(muscles);
  if (muscles.length === 0) return null;
  return (
    <Text className={`text-[11px] ${className}`} numberOfLines={2}>
      <Text className="text-accent-text">{muscleNames(primary)}</Text>
      {secondary.length > 0 && (
        <Text className="text-muted">{primary.length > 0 ? ' · ' : ''}{muscleNames(secondary)}</Text>
      )}
    </Text>
  );
}
