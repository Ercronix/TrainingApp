import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { confirm, alert } from '@/utils/confirm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { RestTimer } from '@/components/RestTimer';
import { useRestTimerStore } from '@/store/restTimerStore';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { ExerciseLog, UpdateExerciseLogRequest } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useIsOnline } from '@/hooks/useIsOnline';
import { formatSets, previousSetsOf, setsOf } from '@/utils/sets';

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
  const insets = useSafeAreaInsets();
  const { training, isLoading, updateExerciseLog, completeTraining } = useTraining(trainingLogId);
  const [exerciseOrder, setExerciseOrder] = useState<number[]>([]);
  const [dockHeight, setDockHeight] = useState(0);
  const c = useTheme();
  const isOnline = useIsOnline();
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
    // Ticking off an exercise without logging it records the plan as its sets
    if (completing && setsOf(exerciseLog).length === 0 && exerciseLog.plannedSets) {
      data.sets = Array.from({ length: exerciseLog.plannedSets }, () => ({
        reps: exerciseLog.plannedReps ?? 0, weight: exerciseLog.plannedWeight, rpe: null, warmup: false,
      }));
    }
    updateExerciseLog.mutate({ exerciseLogId: exerciseLog.id, data });
  };

  const handleComplete = () => {
    if (!isOnline) {
      alert('Offline', 'Reconnect to finish the session. Your logged exercises are kept and will sync.');
      return;
    }
    const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
    const totalCount = training?.exercises.length || 0;
    const doComplete = () =>
      completeTraining.mutate(undefined, {
        onSuccess: () => {
          // Don't leave a rest timer running (and notifying) after the session ends
          useRestTimerStore.getState().reset();
          alert('Done!', 'Training session complete!');
          router.replace('/(tabs)');
        },
      });
    if (completedCount < totalCount) {
      confirm('Incomplete', `${completedCount}/${totalCount} exercises done. Complete anyway?`, doComplete, 'Complete', 'Cancel');
    } else {
      doComplete();
    }
  };

  const renderExerciseItem = ({ item }: { item: ExerciseLog }) => (
    <View className={`rounded-md mb-2 flex-row overflow-hidden relative ${item.completed ? 'bg-surface-done' : 'bg-surface'}`}>
      {/* Done stripe */}
      {item.completed && <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />}

      {/* Main tap area */}
      <TouchableOpacity
        className="flex-1 px-5 py-4 flex-row items-center gap-2"
        onPress={() =>
          router.push({
            pathname: '/exercise-detail' as any,
            params: {
              exerciseId: item.exerciseId?.toString() ?? '', exerciseName: item.exerciseName,
              libraryExerciseId: item.libraryExerciseId?.toString() ?? '',
              description: '', videoUrl: '',
              sets: item.plannedSets?.toString() || '', reps: item.plannedReps?.toString() || '',
              weight: item.plannedWeight?.toString() || '', workoutId: item.workoutId?.toString() ?? '',
            },
          })
        }
        activeOpacity={0.85}
      >
        <View className="flex-1">
          <Text className="text-primary text-base font-bold tracking-tight mb-1">
            {item.exerciseName}
          </Text>
          {item.plannedSets && item.plannedReps && (
            <Text className="text-muted text-xs">
              {item.plannedSets} × {item.plannedReps} {item.repUnit === 'seconds' ? 'sec' : 'reps'}{item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
            </Text>
          )}
          {!item.completed && previousSetsOf(item).length > 0 && (
            <Text className="text-subtle text-[11px] mt-1">
              Last: {formatSets(previousSetsOf(item), item.repUnit)}
            </Text>
          )}
          {item.completed && (
            <Text className="text-accent-text text-[11px] mt-1">
              ✓ {formatSets(setsOf(item), item.repUnit)}
            </Text>
          )}
        </View>
        <Ionicons name="information-circle-outline" size={18} color={c.muted} />
      </TouchableOpacity>

      {/* Toggle */}
      <TouchableOpacity
        className={`w-14 justify-center items-center ${item.completed ? 'bg-surface-done' : 'bg-base'}`}
        onPress={() => toggleExercise(item)}
      >
        <View className={`w-6 h-6 rounded-full justify-center items-center ${item.completed ? 'bg-accent' : 'border-2 border-elevated'}`}>
          {item.completed && <Ionicons name="checkmark" size={14} color={c.accentFg} />}
        </View>
      </TouchableOpacity>

      {/* Log */}
      <TouchableOpacity
        className="w-14 justify-center items-center bg-base gap-0.5"
        onPress={() =>
          router.push({
            pathname: '/log-exercise' as any,
            // The modal reads the log (sets, plan, previous session) from the training query
            params: {
              exerciseLogId: item.id.toString(), exerciseId: item.exerciseId?.toString() ?? '',
              exerciseName: item.exerciseName, trainingLogId,
            },
          })
        }
      >
        <Ionicons name="create-outline" size={22} color={item.completed ? c.accent : c.muted} />
        <Text className={`text-[8px] tracking-widest ${item.completed ? 'text-accent-text' : 'text-muted'}`}>LOG</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
  const totalCount = training?.exercises.length || 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-6 pt-14 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={20} color={c.accent} />
        </TouchableOpacity>
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">ACTIVE SESSION</Text>
        <Text className="text-primary text-[32px] font-bold tracking-tighter mb-1">{training?.splitName}</Text>
        <Text className="text-muted text-[11px] tracking-[2px]">
          {completedCount}/{totalCount} COMPLETE · {formatElapsed(elapsedSeconds)} ELAPSED
        </Text>
        {!isOnline && (
          <View className="flex-row items-center gap-2 mt-3 bg-surface rounded-sm px-3 py-2 self-start">
            <Ionicons name="cloud-offline-outline" size={14} color={c.muted} />
            <Text className="text-muted text-[10px] tracking-[2px]">OFFLINE · CHANGES SYNC WHEN BACK ONLINE</Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View className="h-[3px] bg-surface mx-4 mb-3 rounded-full overflow-hidden">
        <View className="h-full bg-accent rounded-full" style={{ width: `${progressPct}%` }} />
      </View>

      <FlatList
        data={orderedExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: dockHeight + 16 }}
        ListFooterComponent={
          !training?.isCompleted ? (
            <TouchableOpacity
              className="bg-surface rounded-md py-4 flex-row items-center justify-center gap-2 mt-1"
              onPress={() =>
                router.push({
                  pathname: '/add-exercise' as any,
                  params: { trainingLogId },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={c.accent} />
              <Text className="text-primary text-sm font-bold tracking-[2px]">ADD EXERCISE</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Bottom dock */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-base border-t border-surface px-4 pt-4"
        style={{ paddingBottom: 32 + insets.bottom }}
        onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}
      >
        <View className="mb-3">
          <RestTimer />
        </View>
        <TouchableOpacity
          className={`bg-accent rounded-md py-4 flex-row items-center justify-center gap-2 ${completeTraining.isPending ? 'opacity-50' : ''}`}
          onPress={handleComplete}
          disabled={completeTraining.isPending}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {completeTraining.isPending ? 'SAVING...' : 'COMPLETE SESSION'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
