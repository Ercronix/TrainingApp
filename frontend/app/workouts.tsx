import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkouts } from '@/hooks/useWorkouts';
import { WorkoutRow } from '@/components/WorkoutRow';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable } from '@/components/AnimatedPressable';

export default function WorkoutsScreen() {
  const { splitId, splitName, currentBlock } = useLocalSearchParams<{ splitId: string; splitName: string; currentBlock: string }>();
  const router = useRouter();
  const { workouts, isLoading, isRefetching, refetch, deleteWorkout } = useWorkouts(splitId);
  const insets = useSafeAreaInsets();
  const c = useTheme();

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
          renderItem={({ item, index }) => (
            <WorkoutRow workout={item} index={index} splitId={splitId} onDelete={(id) => deleteWorkout.mutate(id)} />
          )}
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
          activeOpacity={0.8}
        >
          <Text className="text-accent-fg text-3xl font-bold leading-8">+</Text>
        </AnimatedPressable>
      </Link>
    </View>
  );
}
