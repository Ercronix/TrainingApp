import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts } from '@/hooks/useWorkouts';

export default function WorkoutsScreen() {
  const { splitId, splitName } = useLocalSearchParams<{ splitId: string; splitName: string }>();
  const router = useRouter();

  const { workouts, isLoading, isRefetching, refetch, deleteWorkout } = useWorkouts(splitId);

  const startTrainingMutation = useMutation({
    mutationFn: () => trainingLogsApi.start(Number(splitId)),
    onSuccess: (data) => {
      router.push({
        pathname: '/training',
        params: { trainingLogId: data.id.toString() }
      });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to start training');
    },
  });

  const handleStartTraining = () => {
    if (!workouts || workouts.length === 0) {
      Alert.alert('No Workouts', 'Please add workouts first');
      return;
    }

    Alert.alert(
      'Start Training',
      `Start training session for "${splitName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => startTrainingMutation.mutate() }
      ]
    );
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Workout',
      `Delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout.mutate(id)
        }
      ]
    );
  };

  const renderWorkoutItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl mb-3 border border-gray-200">
      <TouchableOpacity
        className="p-4"
        onPress={() => {
          router.push({
            pathname: '/workout-detail' as any,
            params: {
              workoutId: item.id.toString(),
              name: item.name,
              description: item.description || '',
              videoUrl: item.videoUrl || '',
              sets: item.sets?.toString() || '',
              reps: item.reps?.toString() || '',
              weight: item.plannedWeight?.toString() || '',
            }
          });
        }}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              {item.name}
            </Text>

            {item.sets && item.reps && (
              <Text className="text-sm text-gray-600 mb-1">
                {item.sets} × {item.reps} reps
              </Text>
            )}

            {item.plannedWeight && (
              <Text className="text-sm text-gray-600 mb-1">
                Weight: {item.plannedWeight} kg
              </Text>
            )}

            {item.lastUsedWeight && (
              <View className="mt-2 pt-2 border-t border-gray-100">
                <Text className="text-xs text-green-600 font-medium">
                  Last: {item.lastUsedWeight} kg
                </Text>
              </View>
            )}
          </View>

          {/* Icons */}
          <View className="flex-row gap-2 ml-2">
            {item.videoUrl && (
              <Ionicons name="play-circle" size={24} color="#3B82F6" />
            )}

            {/* Delete Button */}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item.id, item.name);
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
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
        <Text className="text-2xl font-bold text-gray-800">
          {splitName}
        </Text>
      </View>

      {/* Start Training Button */}
      {workouts && workouts.length > 0 && (
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <TouchableOpacity
            className={`bg-green-500 rounded-lg py-3 items-center ${
              startTrainingMutation.isPending ? 'opacity-50' : ''
            }`}
            onPress={handleStartTraining}
            disabled={startTrainingMutation.isPending}
          >
            <Text className="text-white text-base font-semibold">
              {startTrainingMutation.isPending ? 'Starting...' : '🏋️ Start Training'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Workouts List */}
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
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-xl text-gray-400 mb-2">No workouts yet</Text>
              <Text className="text-sm text-gray-400">
                Add workouts to this split!
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Link
        href={{
          pathname: '/create-workout',
          params: { splitId }
        }}
        asChild
      >
        <TouchableOpacity
          className="absolute right-6 bottom-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-lg"
        >
          <Text className="text-white text-3xl font-light">+</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}