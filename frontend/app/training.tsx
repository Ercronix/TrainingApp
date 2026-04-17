import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { confirm, alert } from '@/utils/confirm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { RestTimer } from '@/components/RestTimer';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { ExerciseLog, UpdateExerciseLogRequest } from '@/types';

function formatElapsed(seconds: number | null): string {
  if (seconds == null) return '--:--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function TrainingScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const { training, isLoading, updateExerciseLog, completeTraining } = useTraining(trainingLogId);
  const [exerciseOrder, setExerciseOrder] = useState<number[]>([]);
  const elapsedSeconds = useElapsedSeconds({
    startedAt: training?.startedAt,
    completedAt: training?.completedAt,
    durationSeconds: training?.durationSeconds,
  });

  useEffect(() => { setExerciseOrder([]); }, [trainingLogId]);

  useEffect(() => {
    const exercises = training?.exercises;
    if (!exercises || exercises.length === 0) return;
    setExerciseOrder((prev) => {
      if (prev.length === 0) return exercises.map((e: ExerciseLog) => e.id);
      const ids = exercises.map((e: ExerciseLog) => e.id);
      const idSet = new Set(ids);
      const next = prev.filter((id) => idSet.has(id));
      const nextSet = new Set(next);
      for (const id of ids) { if (!nextSet.has(id)) { next.push(id); nextSet.add(id); } }
      return next;
    });
  }, [training?.exercises]);

  const orderedExercises = useMemo(() => {
    const exercises = training?.exercises ?? [];
    if (exerciseOrder.length === 0) return exercises;
    const byId = new Map<number, ExerciseLog>(exercises.map((e: ExerciseLog) => [e.id, e]));
    const orderSet = new Set(exerciseOrder);
    return exerciseOrder.map((id) => byId.get(id)).filter((e): e is ExerciseLog => e !== undefined).concat(exercises.filter((e: ExerciseLog) => !orderSet.has(e.id)));
  }, [training?.exercises, exerciseOrder]);

  const toggleExercise = (exerciseLog: ExerciseLog) => {
    const completing = !exerciseLog.completed;
    const data: UpdateExerciseLogRequest = { completed: completing };
    if (completing) {
      if (!exerciseLog.setsCompleted || exerciseLog.setsCompleted === 0) data.setsCompleted = exerciseLog.plannedSets ?? 0;
      if (!exerciseLog.repsCompleted || exerciseLog.repsCompleted === 0) data.repsCompleted = exerciseLog.plannedReps ?? 0;
      if (!exerciseLog.weightUsed && exerciseLog.plannedWeight) data.weightUsed = exerciseLog.plannedWeight;
    }
    updateExerciseLog.mutate({ exerciseLogId: exerciseLog.id, data });
  };

  const handleComplete = () => {
    const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
    const totalCount = training?.exercises.length || 0;
    const doComplete = () =>
      completeTraining.mutate(undefined, {
        onSuccess: () => { alert('Done!', 'Training session complete!'); router.replace('/(tabs)'); },
      });
    if (completedCount < totalCount) {
      confirm('Incomplete', `${completedCount}/${totalCount} exercises done. Complete anyway?`, doComplete, 'Complete', 'Cancel');
    } else {
      doComplete();
    }
  };

  const renderExerciseItem = ({ item }: { item: ExerciseLog }) => (
    <View className={`rounded-md mb-2 flex-row overflow-hidden relative ${item.completed ? 'bg-[#0d1408]' : 'bg-[#131313]'}`}>
      {/* Done stripe */}
      {item.completed && <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#cafd00]" />}

      {/* Main tap area */}
      <TouchableOpacity
        className="flex-1 px-5 py-4 flex-row items-center gap-2"
        onPress={() =>
          router.push({
            pathname: '/exercise-detail' as any,
            params: {
              exerciseId: item.exerciseId?.toString() ?? '', exerciseName: item.exerciseName,
              description: '', videoUrl: '',
              sets: item.plannedSets?.toString() || '', reps: item.plannedReps?.toString() || '',
              weight: item.plannedWeight?.toString() || '', workoutId: item.workoutId?.toString() ?? '',
            },
          })
        }
        activeOpacity={0.85}
      >
        <View className="flex-1">
          <Text className={`text-base font-bold tracking-tight mb-1 ${item.completed ? 'text-[#f5f5f5]' : 'text-[#f5f5f5]'}`}>
            {item.exerciseName}
          </Text>
          {item.plannedSets && item.plannedReps && (
            <Text className="text-[#7a7a7a] text-xs">
              {item.plannedSets} × {item.plannedReps}{item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
            </Text>
          )}
          {item.completed && (
            <Text className="text-[#cafd00] text-[11px] mt-1">
              ✓ {item.setsCompleted}×{item.repsCompleted}{item.weightUsed != null ? ` @ ${item.weightUsed} kg` : ''}
            </Text>
          )}
        </View>
        <Ionicons name="information-circle-outline" size={18} color="#7a7a7a" />
      </TouchableOpacity>

      {/* Toggle */}
      <TouchableOpacity
        className={`w-14 justify-center items-center ${item.completed ? 'bg-[#0d1408]' : 'bg-[#0e0e0e]'}`}
        onPress={() => toggleExercise(item)}
      >
        <View className={`w-6 h-6 rounded-full justify-center items-center ${item.completed ? 'bg-[#cafd00]' : 'border-2 border-[#2a2a2a]'}`}>
          {item.completed && <Ionicons name="checkmark" size={14} color="#0e0e0e" />}
        </View>
      </TouchableOpacity>

      {/* Log */}
      <TouchableOpacity
        className="w-14 justify-center items-center bg-[#0e0e0e] gap-0.5"
        onPress={() =>
          router.push({
            pathname: '/log-exercise' as any,
            params: {
              exerciseLogId: item.id.toString(), exerciseName: item.exerciseName,
              plannedSets: item.plannedSets?.toString() || '', plannedReps: item.plannedReps?.toString() || '',
              plannedWeight: item.plannedWeight?.toString() || '', trainingLogId,
            },
          })
        }
      >
        <Ionicons name="create-outline" size={22} color={item.completed ? '#cafd00' : '#7a7a7a'} />
        <Text className={`text-[8px] tracking-widest ${item.completed ? 'text-[#cafd00]' : 'text-[#7a7a7a]'}`}>LOG</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
  const totalCount = training?.exercises.length || 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color="#cafd00" />
        </TouchableOpacity>
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">ACTIVE SESSION</Text>
        <Text className="text-[#f5f5f5] text-[32px] font-bold tracking-tighter mb-1">{training?.splitName}</Text>
        <Text className="text-[#7a7a7a] text-[11px] tracking-[2px]">
          {completedCount}/{totalCount} COMPLETE · {formatElapsed(elapsedSeconds)} ELAPSED
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-[3px] bg-[#131313] mx-4 mb-3 rounded-full overflow-hidden">
        <View className="h-full bg-[#cafd00] rounded-full" style={{ width: `${progressPct}%` }} />
      </View>

      <FlatList
        data={orderedExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 220 }}
      />

      {/* Bottom dock */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#0e0e0e] border-t border-[#131313] px-4 pb-8 pt-4">
        {!training?.isCompleted && (
          <TouchableOpacity
            className="bg-[#131313] rounded-md py-4 flex-row items-center justify-center gap-2 mb-3"
            style={{ shadowColor: '#131313', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 }}
            onPress={() =>
              router.push({
                pathname: '/add-exercise' as any,
                params: { trainingLogId },
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#cafd00" />
            <Text className="text-[#f5f5f5] text-sm font-bold tracking-[2px]">ADD EXERCISE</Text>
          </TouchableOpacity>
        )}
        <View className="mb-3">
          <RestTimer duration={120} onComplete={() => alert('Rest Complete!', 'Time for next set!')} />
        </View>
        <TouchableOpacity
          className={`bg-[#cafd00] rounded-md py-4 flex-row items-center justify-center gap-2 ${completeTraining.isPending ? 'opacity-50' : ''}`}
          style={{ shadowColor: '#cafd00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }}
          onPress={handleComplete}
          disabled={completeTraining.isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={18} color="#0e0e0e" />
          <Text className="text-[#0e0e0e] text-sm font-bold tracking-[2px]">
            {completeTraining.isPending ? 'SAVING...' : 'COMPLETE SESSION'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
