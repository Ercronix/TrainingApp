import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts } from '@/hooks/useWorkouts';
import { confirm } from '@/utils/confirm';

export default function WorkoutsScreen() {
  const { splitId, splitName } = useLocalSearchParams<{
    splitId: string;
    splitName: string;
  }>();
  const router = useRouter();
  const { workouts, isLoading, isRefetching, refetch, deleteWorkout } = useWorkouts(splitId);

  const handleDelete = (id: number, name: string) => {
    confirm(
      'Delete Workout',
      `Delete "${name}" and all its exercises?`,
      () => deleteWorkout.mutate(id),
      'Delete'
    );
  };

  const renderWorkoutItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl mb-3 border border-gray-200">
      <TouchableOpacity
        className="p-4"
        onPress={() =>
          router.push({
            pathname: '/workout-detail' as any,
            params: { workoutId: item.id.toString(), workoutName: item.name, splitId },
          })
        }
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 mb-1">{item.name}</Text>
            <Text className="text-sm text-gray-500">
              {item.exerciseCount ?? 0}{' '}
              {item.exerciseCount === 1 ? 'exercise' : 'exercises'} · Tap to view & train
            </Text>
          </View>

          <View className="flex-row gap-3 items-center ml-2">
            {/* Edit */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: '/edit-workout' as any,
                  params: {
                    workoutId: item.id.toString(),
                    splitId,
                    currentName: item.name,
                  },
                });
              }}
            >
              <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            {/* Delete */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id, item.name);
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-500 text-base">← Back</Text>
          </TouchableOpacity>
          {/* Edit split name */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/edit-split' as any,
                params: { splitId, currentName: splitName },
              })
            }
          >
            <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <Text className="text-2xl font-bold text-gray-800">{splitName}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Select a workout day to view exercises and start training
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading workouts...</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-xl text-gray-400 mb-2">No workout days yet</Text>
              <Text className="text-sm text-gray-400">Tap + to add your first workout day</Text>
            </View>
          }
        />
      )}

      <Link href={{ pathname: '/create-workout', params: { splitId } }} asChild>
        <TouchableOpacity className="absolute right-6 bottom-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg">
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}