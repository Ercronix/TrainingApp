import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SwipeableRow from '@/components/SwipeableRow';
import { useTheme } from '@/hooks/useTheme';
import { confirm } from '@/utils/confirm';
import { Workout } from '@/types';

interface Props {
  workout: Workout;
  index: number;
  splitId: string;
  onDelete: (id: number) => void;
}

/** A workout day of a split: opens its detail, swipe to edit or delete. */
export function WorkoutRow({ workout, index, splitId, onDelete }: Props) {
  const router = useRouter();
  const c = useTheme();

  const handleDelete = () => {
    confirm('Delete Workout', `Delete "${workout.name}" and all its exercises?`, () => onDelete(workout.id), 'Delete');
  };

  return (
    <SwipeableRow
      rightActions={[
        {
          icon: 'pencil-outline',
          color: c.accent,
          backgroundColor: c.accentMuted,
          label: 'EDIT',
          onPress: () =>
            router.push({ pathname: '/edit-workout' as any, params: { workoutId: workout.id.toString(), splitId, currentName: workout.name } }),
        },
        {
          icon: 'trash-outline',
          color: c.danger,
          backgroundColor: c.dangerMuted,
          label: 'DELETE',
          onPress: handleDelete,
        },
      ]}
    >
      <TouchableOpacity
        className="bg-surface rounded-l-md px-5 py-5 flex-row items-center gap-3"
        onPress={() =>
          router.push({ pathname: '/workout-detail' as any, params: { workoutId: workout.id.toString(), workoutName: workout.name, splitId } })
        }
        activeOpacity={0.85}
      >
        <Text className="text-dim text-[28px] font-mono-bold tracking-tighter min-w-[36px]">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View className="flex-1">
          <Text className="text-primary text-lg font-bold tracking-tight mb-1">{workout.name}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">
            {workout.exerciseCount ?? 0} {workout.exerciseCount === 1 ? 'EXERCISE' : 'EXERCISES'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.subtle} />
      </TouchableOpacity>
    </SwipeableRow>
  );
}
