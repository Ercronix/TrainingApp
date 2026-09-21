import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkouts } from '@/hooks/useWorkouts';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { Workout } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function WorkoutsScreen() {
  const { splitId, splitName, currentBlock } = useLocalSearchParams<{ splitId: string; splitName: string; currentBlock: string }>();
  const router = useRouter();
  const { workouts, isLoading, isRefetching, refetch, deleteWorkout } = useWorkouts(splitId);
  const insets = useSafeAreaInsets();
  const c = useTheme();

  const handleDelete = (id: number, name: string) => {
    confirm('Delete Workout', `Delete "${name}" and all its exercises?`, () => deleteWorkout.mutate(id), 'Delete');
  };

  const renderWorkoutItem = ({ item, index }: { item: Workout; index: number }) => (
    <SwipeableRow
      rightActions={[
        {
          icon: 'pencil-outline',
          color: c.accent,
          backgroundColor: c.accentMuted,
          label: 'EDIT',
          onPress: () =>
            router.push({ pathname: '/edit-workout' as any, params: { workoutId: item.id.toString(), splitId, currentName: item.name } }),
        },
        {
          icon: 'trash-outline',
          color: c.danger,
          backgroundColor: c.dangerMuted,
          label: 'DELETE',
          onPress: () => handleDelete(item.id, item.name),
        },
      ]}
    >
      <TouchableOpacity
        className="bg-surface rounded-l-md px-5 py-5 flex-row items-center gap-3"
        onPress={() =>
          router.push({ pathname: '/workout-detail' as any, params: { workoutId: item.id.toString(), workoutName: item.name, splitId } })
        }
        activeOpacity={0.85}
      >
        <Text className="text-dim text-[28px] font-mono-bold tracking-tighter min-w-[36px]">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View className="flex-1">
          <Text className="text-primary text-lg font-bold tracking-tight mb-1">{item.name}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">
            {item.exerciseCount ?? 0} {item.exerciseCount === 1 ? 'EXERCISE' : 'EXERCISES'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.subtle} />
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">SPLIT</Text>
            <Text className="text-primary text-[36px] font-bold tracking-tighter leading-10" numberOfLines={1}>
              {splitName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/edit-split' as any, params: { splitId, currentName: splitName, currentBlock: currentBlock || '1' } })
            }
            className="mt-5"
          >
            <Ionicons name="pencil-outline" size={18} color={c.muted} />
          </TouchableOpacity>
        </View>
        <Text className="text-muted text-xs">Select a day to view exercises and start training</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 + insets.bottom }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name="calendar-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO WORKOUT DAYS</Text>
              <Text className="text-dim text-sm">Tap + to add your first day</Text>
            </View>
          }
        />
      )}

      <Link href={{ pathname: '/create-workout', params: { splitId } }} asChild>
        <AnimatedPressable
          wrapperStyle={{ position: 'absolute', right: 24, bottom: 32 + insets.bottom }}
          className="w-14 h-14 rounded-md bg-accent justify-center items-center"
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
          activeOpacity={0.8}
        >
          <Text className="text-accent-fg text-3xl font-bold leading-8">+</Text>
        </AnimatedPressable>
      </Link>
    </View>
  );
}
