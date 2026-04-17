import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts } from '@/hooks/useWorkouts';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { Workout } from '@/types';

export default function WorkoutsScreen() {
  const { splitId, splitName } = useLocalSearchParams<{ splitId: string; splitName: string }>();
  const router = useRouter();
  const { workouts, isLoading, isRefetching, refetch, deleteWorkout } = useWorkouts(splitId);

  const handleDelete = (id: number, name: string) => {
    confirm('Delete Workout', `Delete "${name}" and all its exercises?`, () => deleteWorkout.mutate(id), 'Delete');
  };

  const renderWorkoutItem = ({ item, index }: { item: Workout; index: number }) => (
    <SwipeableRow
      rightActions={[
        {
          icon: 'pencil-outline',
          color: '#cafd00',
          backgroundColor: '#1a2200',
          label: 'EDIT',
          onPress: () =>
            router.push({ pathname: '/edit-workout' as any, params: { workoutId: item.id.toString(), splitId, currentName: item.name } }),
        },
        {
          icon: 'trash-outline',
          color: '#ff734a',
          backgroundColor: '#2a1410',
          label: 'DELETE',
          onPress: () => handleDelete(item.id, item.name),
        },
      ]}
    >
      <TouchableOpacity
        className="bg-[#131313] rounded-md px-5 py-5 flex-row items-center gap-3"
        onPress={() =>
          router.push({ pathname: '/workout-detail' as any, params: { workoutId: item.id.toString(), workoutName: item.name, splitId } })
        }
        activeOpacity={0.85}
      >
        <Text className="text-[#1a1a1a] text-[28px] font-bold tracking-tighter min-w-[36px]">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View className="flex-1">
          <Text className="text-[#f5f5f5] text-lg font-bold tracking-tight mb-1">{item.name}</Text>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[2px]">
            {item.exerciseCount ?? 0} {item.exerciseCount === 1 ? 'EXERCISE' : 'EXERCISES'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#262626" />
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color="#cafd00" />
        </TouchableOpacity>
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">SPLIT</Text>
            <Text className="text-[#f5f5f5] text-[36px] font-bold tracking-tighter leading-10" numberOfLines={1}>
              {splitName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/edit-split' as any, params: { splitId, currentName: splitName } })
            }
            className="mt-5"
          >
            <Ionicons name="pencil-outline" size={18} color="#7a7a7a" />
          </TouchableOpacity>
        </View>
        <Text className="text-[#7a7a7a] text-xs">Select a day to view exercises and start training</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" />}
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name="calendar-outline" size={48} color="#262626" />
              <Text className="text-[#262626] text-xl font-bold tracking-[2px]">NO WORKOUT DAYS</Text>
              <Text className="text-[#3a3a3a] text-sm">Tap + to add your first day</Text>
            </View>
          }
        />
      )}

      <Link href={{ pathname: '/create-workout', params: { splitId } }} asChild>
        <TouchableOpacity
          className="absolute right-6 bottom-8 w-14 h-14 rounded-md bg-[#cafd00] justify-center items-center"
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
          activeOpacity={0.8}
        >
          <Text className="text-[#0e0e0e] text-3xl font-bold leading-8">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
