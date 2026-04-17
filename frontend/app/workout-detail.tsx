import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useExercises } from '@/hooks/useExercises';
import { useStartTraining } from '@/hooks/useStartTraining';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { Exercise } from '@/types';

export default function WorkoutDetailScreen() {
  const { workoutId, workoutName, splitId } = useLocalSearchParams<{
    workoutId: string; workoutName: string; splitId: string;
  }>();
  const router = useRouter();
  const { exercises, isLoading, isRefetching, refetch, deleteExercise, reorderExercises } = useExercises(workoutId);
  const { startTraining, isPending: isStarting } = useStartTraining(workoutId, workoutName);
  const [reorderMode, setReorderMode] = useState(false);

  const handleDelete = (id: number, name: string) => {
    confirm('Delete Exercise', `Delete "${name}"?`, () => deleteExercise.mutate(id), 'Delete');
  };

  const handleDragEnd = ({ data }: { data: Exercise[] }) => {
    reorderExercises.mutate(data.map((item, index) => ({ id: item.id, orderIndex: index })));
  };

  const renderExerciseItem = ({ item, drag, isActive }: RenderItemParams<Exercise>) => (
    <ScaleDecorator>
      <SwipeableRow
        enabled={!reorderMode}
        rightActions={[
          {
            icon: 'pencil-outline',
            color: '#cafd00',
            backgroundColor: '#1a2200',
            label: 'EDIT',
            onPress: () =>
              router.push({
                pathname: '/edit-exercise' as any,
                params: {
                  workoutId, exerciseId: item.id.toString(),
                  currentName: item.name, currentSets: item.sets?.toString() || '',
                  currentReps: item.reps?.toString() || '', currentWeight: item.plannedWeight?.toString() || '',
                },
              }),
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
          className={`rounded-md overflow-hidden ${isActive ? 'bg-[#1a1a1a]' : 'bg-[#131313]'}`}
          onPress={() => {
            if (reorderMode) return;
            router.push({
              pathname: '/exercise-detail' as any,
              params: {
                exerciseId: item.id.toString(), exerciseName: item.name,
                description: item.description || '', videoUrl: item.videoUrl || '',
                sets: item.sets?.toString() || '', reps: item.reps?.toString() || '',
                weight: item.plannedWeight?.toString() || '', workoutId,
              },
            });
          }}
          onLongPress={reorderMode ? drag : undefined}
          delayLongPress={100}
          disabled={isActive}
          activeOpacity={0.85}
        >
          <View className="flex-row items-center px-5 py-4 gap-3">
            <View className="flex-1">
              <Text className="text-[#f5f5f5] text-[17px] font-bold tracking-tight mb-1">{item.name}</Text>
              {item.sets && item.reps && (
                <Text className="text-[#7a7a7a] text-xs">
                  {item.sets} × {item.reps} reps{item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
                </Text>
              )}
              {item.lastUsedWeight && (
                <Text className="text-[#cafd00] text-[9px] tracking-[2px] mt-1">LAST: {item.lastUsedWeight} kg</Text>
              )}
            </View>
            <View className="flex-row items-center gap-3">
              {reorderMode ? (
                <TouchableOpacity onLongPress={drag} delayLongPress={100}>
                  <Ionicons name="reorder-three-outline" size={24} color="#7a7a7a" />
                </TouchableOpacity>
              ) : (
                <>
                  {item.videoUrl && <Ionicons name="play-circle" size={18} color="#81ecff" />}
                  <Ionicons name="chevron-forward" size={18} color="#262626" />
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    </ScaleDecorator>
  );

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#cafd00" />
          </TouchableOpacity>
          <View className="flex-row gap-4 items-center">
            <TouchableOpacity onPress={() => setReorderMode((v) => !v)}>
              <Ionicons
                name={reorderMode ? 'checkmark-done-outline' : 'reorder-three-outline'}
                size={22}
                color={reorderMode ? '#cafd00' : '#7a7a7a'}
              />
            </TouchableOpacity>
            {!reorderMode && (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/edit-workout' as any, params: { workoutId, splitId, currentName: workoutName } })
                }
              >
                <Ionicons name="pencil-outline" size={20} color="#7a7a7a" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">WORKOUT DAY</Text>
        <Text className="text-[#f5f5f5] text-[36px] font-bold tracking-tighter mb-1">{workoutName}</Text>
        <Text className="text-[#7a7a7a] text-[10px] tracking-[2px]">
          {exercises.length} {exercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}
          {reorderMode ? ' · HOLD TO REORDER' : ''}
        </Text>
      </View>

      {/* Start Training */}
      {!reorderMode && exercises.length > 0 && (
        <TouchableOpacity
          className={`mx-4 mb-3 bg-[#cafd00] rounded-md py-4 flex-row items-center justify-center gap-2 ${isStarting ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => startTraining(exercises.length)}
          disabled={isStarting}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color="#0e0e0e" />
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {isStarting ? 'STARTING...' : 'START TRAINING'}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          activationDistance={reorderMode ? 5 : 999}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={
            !reorderMode ? <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" /> : undefined
          }
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name="add-circle-outline" size={48} color="#262626" />
              <Text className="text-[#262626] text-xl font-bold tracking-[2px]">NO EXERCISES YET</Text>
              <Text className="text-[#3a3a3a] text-sm">Tap + to add your first exercise</Text>
            </View>
          }
        />
      )}

      {!reorderMode && (
        <Link href={{ pathname: '/create-exercise' as any, params: { workoutId } }} asChild>
          <TouchableOpacity
            className="absolute right-6 bottom-8 w-14 h-14 rounded-md bg-[#cafd00] justify-center items-center"
            style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
            activeOpacity={0.8}
          >
            <Text className="text-[#0e0e0e] text-3xl font-bold leading-8">+</Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}
