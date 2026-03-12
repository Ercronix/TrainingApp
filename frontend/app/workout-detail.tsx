import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useExercises } from '@/hooks/useExercises';
import { useStartTraining } from '@/hooks/useStartTraining';
import { confirm } from '@/utils/confirm';

export default function WorkoutDetailScreen() {
  const { workoutId, workoutName, splitId } = useLocalSearchParams<{
    workoutId: string;
    workoutName: string;
    splitId: string;
  }>();

  const router = useRouter();
  const { exercises, isLoading, isRefetching, refetch, deleteExercise, reorderExercises } =
    useExercises(workoutId);
  const { startTraining, isPending: isStarting } = useStartTraining(workoutId, workoutName);

  const [reorderMode, setReorderMode] = useState(false);

  const handleDelete = (id: number, name: string) => {
    confirm('Delete Exercise', `Delete "${name}"?`, () => deleteExercise.mutate(id), 'Delete');
  };

  const handleDragEnd = ({ data }: { data: any[] }) => {
    const reordered = data.map((item, index) => ({ id: item.id, orderIndex: index }));
    reorderExercises.mutate(reordered);
  };

  const renderExerciseItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <View
        className={`bg-slate-900 rounded-xl mb-3 border ${
          isActive ? 'border-blue-400 shadow-md' : 'border-slate-800'
        }`}
        style={{ opacity: isActive ? 0.95 : 1 }}
      >
        <TouchableOpacity
          className="p-4"
          onPress={() => {
            if (reorderMode) return;
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
            });
          }}
          onLongPress={reorderMode ? drag : undefined}
          delayLongPress={100}
          disabled={isActive}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-slate-100 mb-1">{item.name}</Text>
              {item.sets && item.reps && (
                <Text className="text-sm text-slate-300">
                  {item.sets} × {item.reps} reps
                  {item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
                </Text>
              )}
              {item.lastUsedWeight && (
                <Text className="text-xs text-blue-300 font-medium mt-1">
                  Last: {item.lastUsedWeight} kg
                </Text>
              )}
            </View>

            <View className="flex-row gap-3 items-center ml-2">
              {reorderMode ? (
                // In reorder mode: show drag handle, hide other actions
                <TouchableOpacity onLongPress={drag} delayLongPress={100}>
                  <Ionicons name="reorder-three-outline" size={26} color="#64748B" />
                </TouchableOpacity>
              ) : (
                <>
                  {item.videoUrl && <Ionicons name="play-circle" size={20} color="#60A5FA" />}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/edit-exercise' as any,
                        params: {
                          workoutId,
                          exerciseId: item.id.toString(),
                          currentName: item.name,
                          currentSets: item.sets?.toString() || '',
                          currentReps: item.reps?.toString() || '',
                          currentWeight: item.plannedWeight?.toString() || '',
                        },
                      });
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#60A5FA" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id, item.name);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScaleDecorator>
  );

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row gap-4 items-center">
            {/* Reorder toggle */}
            <TouchableOpacity onPress={() => setReorderMode((v) => !v)}>
              <Ionicons
                name={reorderMode ? 'checkmark-done-outline' : 'reorder-three-outline'}
                size={22}
                color={reorderMode ? '#60A5FA' : '#64748B'}
              />
            </TouchableOpacity>
            {/* Edit workout name */}
            {!reorderMode && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/edit-workout' as any,
                    params: { workoutId, splitId, currentName: workoutName },
                  })
                }
              >
                <Ionicons name="pencil-outline" size={20} color="#60A5FA" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-2xl font-bold text-slate-100">{workoutName}</Text>
        <Text className="text-sm text-slate-400 mt-1">
          {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
          {reorderMode ? ' · Hold and drag to reorder' : ''}
        </Text>
      </View>

      {/* Start Training Button — hidden in reorder mode */}
      {!reorderMode && exercises.length > 0 && (
        <View className="bg-slate-900 px-4 py-3 border-b border-slate-800">
          <TouchableOpacity
            className={`bg-blue-600 rounded-lg py-3 items-center ${isStarting ? 'opacity-50' : ''}`}
            onPress={() => startTraining(exercises.length)}
            disabled={isStarting}
          >
            <Text className="text-white text-base font-semibold">
              {isStarting ? 'Starting...' : 'Start Training'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-slate-400">Loading exercises...</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          activationDistance={reorderMode ? 5 : 999} // only draggable in reorder mode
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            !reorderMode ? (
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            ) : undefined
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-xl text-slate-500 mb-2">No exercises yet</Text>
              <Text className="text-sm text-slate-500">Tap + to add your first exercise</Text>
            </View>
          }
        />
      )}

      {/* FAB — hidden in reorder mode */}
      {!reorderMode && (
        <Link href={{ pathname: '/create-exercise' as any, params: { workoutId } }} asChild>
          <TouchableOpacity className="absolute right-6 bottom-6 w-14 h-14 bg-blue-600 rounded-full justify-center items-center shadow-lg">
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}
