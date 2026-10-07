import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { confirm, alert } from '@/utils/confirm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { RestTimer } from '@/components/RestTimer';
import { useRestTimerStore } from '@/store/restTimerStore';
import { useSetDraftStore } from '@/store/setDraftStore';
import { useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { ExerciseLog, UpdateExerciseLogRequest } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { Tactile } from '@/components/Tactile';
import { useIsOnline } from '@/hooks/useIsOnline';
import { formatSets, previousSetsOf, setsOf } from '@/utils/sets';
import { personalRecordOf } from '@/utils/strength';

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
    const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
    const totalCount = training?.exercises.length || 0;
    const records = (training?.exercises ?? [])
      .filter((e: ExerciseLog) => e.completed)
      .map((e: ExerciseLog) => ({ name: e.exerciseName, record: personalRecordOf(e) }))
      .filter((r) => r.record != null)
      .map((r) => `${r.name}: ${r.record}`);
    const finish = (message: string) => {
      // Don't leave a rest timer running (and notifying) after the session ends
      useRestTimerStore.getState().reset();
      useSetDraftStore.getState().clearDrafts((training?.exercises ?? []).map((e: ExerciseLog) => String(e.id)));
      alert('Done!', records.length > 0 ? `${message}\n\nNew records:\n${records.join('\n')}` : message);
      router.replace('/(tabs)');
    };
    const doComplete = () => {
      const variables = { trainingLogId: Number(trainingLogId), completedAtMs: Date.now() };
      if (isOnline) {
        completeTraining.mutate(variables, { onSuccess: () => finish('Training session complete!') });
      } else {
        // Paused until back online; the session is already shown as finished
        completeTraining.mutate(variables);
        finish('Session saved. It will sync when you are back online.');
      }
    };
    if (completedCount < totalCount) {
      confirm('Incomplete', `${completedCount}/${totalCount} exercises done. Complete anyway?`, doComplete, 'Complete', 'Cancel');
    } else {
      doComplete();
    }
  };

  const openLog = (item: ExerciseLog) =>
    router.push({
      pathname: '/log-exercise' as any,
      // The modal reads the log (sets, plan, previous session) from the training query
      params: { exerciseLogId: item.id.toString(), exerciseName: item.exerciseName, trainingLogId },
    });

  // The exercise to do now: the first one not done yet
  const currentId = orderedExercises.find((e) => !e.completed && e.id >= 0)?.id;

  const renderExerciseItem = ({ item }: { item: ExerciseLog }) => {
    // Added while offline (or still being saved): no server id yet, so it can't be opened or logged
    const syncing = item.id < 0;
    const isRecord = item.completed && personalRecordOf(item) != null;
    const isCurrent = item.id === currentId;
    const logged = setsOf(item).length;
    const planned = item.plannedSets ?? 0;
    const unit = item.repUnit === 'seconds' ? 'sec' : 'reps';
    const previous = previousSetsOf(item);
    return (
      <View
        className={`rounded-md mb-2 flex-row items-center overflow-hidden border-2 border-b-[6px] ${item.completed ? 'bg-surface-done' : 'bg-surface'} ${isCurrent ? 'border-accent' : item.completed ? 'border-edge-done' : 'border-edge'} ${syncing ? 'opacity-50' : ''}`}
      >
        {/* The whole row opens the log screen */}
        <TouchableOpacity
          className="flex-1 pl-4 pr-2 py-4 gap-1"
          onPress={() => openLog(item)}
          activeOpacity={0.85}
          disabled={syncing}
          accessibilityLabel={`Log ${item.exerciseName}`}
        >
          {isCurrent && <Text className="text-accent-text text-[9px] tracking-[3px]">NOW</Text>}
          <View className="flex-row items-center gap-2">
            <Text className="text-primary text-base font-bold tracking-tight flex-shrink" numberOfLines={1}>
              {item.exerciseName}
            </Text>
            {isRecord && (
              <View className="flex-row items-center gap-1 bg-accent rounded-sm px-1.5 py-0.5" accessibilityLabel="Personal record">
                <Ionicons name="trophy" size={10} color={c.accentFg} />
                <Text className="text-accent-fg text-[9px] font-bold tracking-[1px]">PR</Text>
              </View>
            )}
          </View>
          {item.completed || logged > 0 ? (
            <Text className={`text-xs font-mono ${item.completed ? 'text-accent-text' : 'text-primary'}`} numberOfLines={1}>
              {formatSets(setsOf(item), item.repUnit)}
            </Text>
          ) : (
            <Text className="text-muted text-xs" numberOfLines={1}>
              {item.plannedSets && item.plannedReps
                ? `${item.plannedSets} × ${item.plannedReps} ${unit}${item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}`
                : 'No plan'}
              {previous.length > 0 ? ` · last ${formatSets(previous, item.repUnit)}` : ''}
            </Text>
          )}
          {/* Sets logged so far against the plan */}
          {!item.completed && planned > 0 && (
            <View className="flex-row gap-1 mt-1">
              {Array.from({ length: Math.max(planned, logged) }, (_, i) => (
                <View key={i} className={`w-2 h-2 rounded-full ${i < logged ? 'bg-accent' : 'bg-elevated'}`} />
              ))}
            </View>
          )}
          {syncing && <Text className="text-muted text-[10px] tracking-[2px]">SYNCING…</Text>}
        </TouchableOpacity>

        {/* Tick off without opening it (records the plan when nothing is logged) */}
        <TouchableOpacity
          className="w-14 self-stretch justify-center items-center"
          onPress={() => toggleExercise(item)}
          disabled={syncing}
          accessibilityLabel={item.completed ? `Mark ${item.exerciseName} as not done` : `Mark ${item.exerciseName} as done`}
        >
          <View className={`w-7 h-7 rounded-full justify-center items-center ${item.completed ? 'bg-accent' : 'border-2 border-elevated'}`}>
            {item.completed && <Ionicons name="checkmark" size={16} color={c.accentFg} />}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises.filter((e: ExerciseLog) => e.completed).length || 0;
  const totalCount = training?.exercises.length || 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <View className="flex-1 bg-base">
      {/* Header */}
      <View className="px-5 pt-14 pb-3 gap-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 -ml-3 justify-center items-center" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={22} color={c.accent} />
          </TouchableOpacity>
          <Text className="text-muted text-[13px] font-mono">{formatElapsed(elapsedSeconds)}</Text>
        </View>
        <Text className="text-accent-text text-[10px] tracking-[4px]" numberOfLines={1}>
          {[training?.workoutName, training?.splitName].filter(Boolean).join(' · ').toUpperCase()}
        </Text>
        <Text className="text-primary text-[28px] font-bold tracking-tighter">
          {allDone ? 'All done' : `${completedCount} of ${totalCount} done`}
        </Text>
        {/* One segment per exercise */}
        <View className="flex-row gap-1">
          {orderedExercises.map((e) => (
            <View key={e.id} className={`flex-1 h-1 rounded-full ${e.completed ? 'bg-accent' : 'bg-elevated'}`} />
          ))}
        </View>
        {!isOnline && (
          <View className="flex-row items-center gap-2 mt-1 bg-surface rounded-sm px-3 py-2 self-start">
            <Ionicons name="cloud-offline-outline" size={14} color={c.muted} />
            <Text className="text-muted text-[10px] tracking-[2px]">OFFLINE · CHANGES SYNC WHEN BACK ONLINE</Text>
          </View>
        )}
      </View>

      <FlatList
        data={orderedExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: dockHeight + 16 }}
        ListFooterComponent={
          !training?.isCompleted ? (
            <TouchableOpacity
              className="border border-dashed border-elevated rounded-md py-4 flex-row items-center justify-center gap-2 mt-1"
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
        className="absolute bottom-0 left-0 right-0 bg-base px-4 pt-3"
        style={{ paddingBottom: 32 + insets.bottom }}
        onLayout={(e) => setDockHeight(e.nativeEvent.layout.height)}
      >
        <View className="mb-2">
          <RestTimer />
        </View>
        {/* Becomes the main action once every exercise is done */}
        <Tactile
          variant={allDone ? 'accent' : 'surface'}
          className={`rounded-md py-4 flex-row items-center justify-center gap-2 ${completeTraining.isPending ? 'opacity-50' : ''}`}
          onPress={handleComplete}
          disabled={completeTraining.isPending}
        >
          <Ionicons name="checkmark-done" size={18} color={allDone ? c.accentFg : c.primary} />
          <Text className={`text-sm font-bold tracking-[2px] ${allDone ? 'text-accent-fg' : 'text-primary'}`}>
            {completeTraining.isPending ? 'SAVING...' : 'COMPLETE SESSION'}
          </Text>
        </Tactile>
      </View>
    </View>
  );
}
