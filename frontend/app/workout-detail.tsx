import { View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useExercises } from '@/hooks/useExercises';
import { useStartTraining } from '@/hooks/useStartTraining';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { Exercise } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export default function WorkoutDetailScreen() {
  const { workoutId, workoutName, splitId } = useLocalSearchParams<{
    workoutId: string; workoutName: string; splitId: string;
  }>();
  const router = useRouter();
  const { exercises, isLoading, isRefetching, refetch, deleteExercise, reorderExercises } = useExercises(workoutId);
  const { startTraining, isPending: isStarting } = useStartTraining(workoutId, workoutName);
  const [reorderMode, setReorderMode] = useState(false);
  const insets = useSafeAreaInsets();
  const c = useTheme();

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
            color: c.accent,
            backgroundColor: c.accentMuted,
            label: 'EDIT',
            onPress: () =>
              router.push({
                pathname: '/edit-exercise' as any,
                params: {
                  workoutId, exerciseId: item.id.toString(),
                  currentName: item.name, currentSets: item.sets?.toString() || '',
                  currentReps: item.reps?.toString() || '', currentWeight: item.plannedWeight?.toString() || '',
                  currentRepUnit: item.repUnit || 'reps',
                },
              }),
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
          className={`rounded-md overflow-hidden ${isActive ? 'bg-elevated' : 'bg-surface'}`}
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
              <Text className="text-primary text-[17px] font-bold tracking-tight mb-1">{item.name}</Text>
              {item.sets && item.reps && (
                <Text className="text-muted text-xs">
                  {item.sets} × {item.reps} {item.repUnit === 'seconds' ? 'sec' : 'reps'}{item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
                </Text>
              )}
              {item.lastUsedWeight && (
                <Text className="text-accent-text text-[9px] tracking-[2px] mt-1">LAST: {item.lastUsedWeight} kg</Text>
              )}
            </View>
            <View className="flex-row items-center gap-3">
              {reorderMode ? (
                <TouchableOpacity onLongPress={drag} delayLongPress={100}>
                  <Ionicons name="reorder-three-outline" size={24} color={c.muted} />
                </TouchableOpacity>
              ) : (
                <>
                  {item.videoUrl && <Ionicons name="play-circle" size={18} color={c.info} />}
                  <Ionicons name="chevron-forward" size={18} color={c.subtle} />
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SwipeableRow>
    </ScaleDecorator>
  );

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={c.accent} />
          </TouchableOpacity>
          <View className="flex-row gap-4 items-center">
            <TouchableOpacity onPress={() => setReorderMode((v) => !v)}>
              <Ionicons
                name={reorderMode ? 'checkmark-done-outline' : 'reorder-three-outline'}
                size={22}
                color={reorderMode ? c.accent : c.muted}
              />
            </TouchableOpacity>
            {!reorderMode && (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/edit-workout' as any, params: { workoutId, splitId, currentName: workoutName } })
                }
              >
                <Ionicons name="pencil-outline" size={20} color={c.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">WORKOUT DAY</Text>
        <Text className="text-primary text-[36px] font-bold tracking-tighter mb-1">{workoutName}</Text>
        <Text className="text-muted text-[10px] tracking-[2px]">
          {exercises.length} {exercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}
          {reorderMode ? ' · HOLD TO REORDER' : ''}
        </Text>
      </View>

      {/* Start Training */}
      {!reorderMode && exercises.length > 0 && (
        <TouchableOpacity
          className={`mx-4 mb-3 bg-accent rounded-md py-4 flex-row items-center justify-center gap-2 ${isStarting ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={() => startTraining(exercises.length)}
          disabled={isStarting}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {isStarting ? 'STARTING...' : 'START TRAINING'}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
        </View>
      ) : (
        <DraggableFlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.id.toString()}
          onDragEnd={handleDragEnd}
          activationDistance={reorderMode ? 5 : 999}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 + insets.bottom }}
          refreshControl={
            !reorderMode ? <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} /> : undefined
          }
          ListEmptyComponent={
            <View className="items-center mt-20 gap-3">
              <Ionicons name="add-circle-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO EXERCISES YET</Text>
              <Text className="text-dim text-sm">Tap + to add your first exercise</Text>
            </View>
          }
        />
      )}

      {!reorderMode && (
        <Link href={{ pathname: '/create-exercise' as any, params: { workoutId } }} asChild>
          <TouchableOpacity
            className="absolute right-6 w-14 h-14 rounded-md bg-accent justify-center items-center"
            style={{ bottom: 32 + insets.bottom, shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
            activeOpacity={0.8}
          >
            <Text className="text-accent-fg text-3xl font-bold leading-8">+</Text>
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}
