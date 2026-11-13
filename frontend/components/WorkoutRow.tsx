import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ActionMenu } from '@/components/ActionMenu';
import { confirm } from '@/utils/confirm';
import { formatDaysAgo } from '@/utils/dates';
import { Workout } from '@/types';

interface Props {
  workout: Workout;
  index: number;
  splitId: string;
  onDelete: (id: number) => void;
  /** When this workout was last completed, if ever. */
  lastDoneAt?: number | null;
  isNext?: boolean;
}

/** A workout day of a split: opens its detail, with a menu to edit or delete it. */
export function WorkoutRow({ workout, index, splitId, onDelete, lastDoneAt, isNext }: Props) {
  const router = useRouter();

  const handleDelete = () => {
    confirm('Delete Workout', `Delete "${workout.name}" and all its exercises?`, () => onDelete(workout.id), 'Delete');
  };

  return (
    <View className="bg-surface rounded-md rim border-edge mb-2 flex-row items-center pr-3">
      <TouchableOpacity
        className="flex-1 pl-5 pr-2 py-5 flex-row items-center gap-3"
        onPress={() =>
          router.push({ pathname: '/workout-detail' as any, params: { workoutId: workout.id.toString(), workoutName: workout.name, splitId } })
        }
        activeOpacity={0.85}
      >
        <Text className="text-dim text-[28px] font-mono-bold tracking-tighter min-w-[36px]">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-primary text-lg font-bold tracking-tight flex-shrink" numberOfLines={1}>{workout.name}</Text>
            {isNext && (
              // Letter spacing also trails the last letter, so the right padding is 2px less
              <View className="bg-accent-muted rounded-sm h-[18px] pl-1.5 pr-1 justify-center">
                <Text
                  className="text-accent-text text-[9px] leading-[12px] font-bold tracking-[2px]"
                  style={{ includeFontPadding: false, textAlignVertical: 'center' }}
                >
                  NEXT
                </Text>
              </View>
            )}
          </View>
          <Text className="text-muted text-xs">
            {workout.exerciseCount ?? 0} {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
            {lastDoneAt != null ? ` · ${formatDaysAgo(lastDoneAt)}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
      <ActionMenu
        accessibilityLabel={`Options for ${workout.name}`}
        actions={[
          {
            icon: 'pencil-outline',
            label: 'Edit',
            onPress: () =>
              router.push({ pathname: '/edit-workout' as any, params: { workoutId: workout.id.toString(), splitId, currentName: workout.name } }),
          },
          { icon: 'trash-outline', label: 'Delete', destructive: true, onPress: handleDelete },
        ]}
      />
    </View>
  );
}
