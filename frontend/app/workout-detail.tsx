import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExercises } from '@/hooks/useExercises';
import { useStartTraining } from '@/hooks/useStartTraining';

export default function WorkoutDetailScreen() {
  const { workoutId, workoutName } = useLocalSearchParams<{
    workoutId: string;
    workoutName: string;
  }>();

  const router = useRouter();
  const { exercises, isLoading, isRefetching, refetch, deleteExercise } = useExercises(workoutId);
  const { startTraining, isPending } = useStartTraining(workoutId, workoutName);

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteExercise.mutate(id),
        },
      ]
    );
  };

  const renderExerciseItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl mb-3 border border-gray-200">
      <TouchableOpacity
        className="p-4"
        onPress={() =>
          router.push({
            pathname: '/exercise-detail' as any,
            params: {
              exerciseId: item.id.toString(),
              exerciseName: item.name,
              description: item.description || '',
              videoUrl: item.videoUrl || '',
              sets: item.sets?.toString() || '',
              reps: item.reps?.toString() || '',
              weight: item.plannedWeight?.toString() || '',
              workoutId,
            },
          })
        }
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 mb-1">{item.name}</Text>

            {item.sets && item.reps && (
              <Text className="text-sm text-gray-600">
                {item.sets} × {item.reps} reps
                {item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
              </Text>
            )}

            {item.lastUsedWeight && (
              <Text className="text-xs text-green-600 font-medium mt-1">
                Last: {item.lastUsedWeight} kg
              </Text>
            )}
          </View>

          <View className="flex-row gap-2 items-center ml-2">
            {item.videoUrl && (
              <Ionicons name="play-circle" size={22} color="#3B82F6" />
            )}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id, item.name);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
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
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-blue-500 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">{workoutName}</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {exercises?.length ?? 0}{' '}
          {exercises?.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>

      {/* Start Training Button */}
      {exercises && exercises.length > 0 && (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <TouchableOpacity
            className={`bg-green-500 rounded-lg py-3 items-center ${isPending ? 'opacity-50' : ''}`}
            onPress={() => startTraining(exercises.length)}
            disabled={isPending}
          >
            <Text className="text-white text-base font-semibold">
              {isPending ? 'Starting...' : '🏋️ Start Training'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Exercise List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">Loading exercises...</Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-xl text-gray-400 mb-2">No exercises yet</Text>
              <Text className="text-sm text-gray-400">
                Tap + to add your first exercise
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Link
        href={{
          pathname: '/create-exercise' as any,
          params: { workoutId },
        }}
        asChild
      >
        <TouchableOpacity className="absolute right-6 bottom-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg">
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}