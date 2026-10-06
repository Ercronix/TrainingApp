import { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSplits } from '@/hooks/useSplits';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useHistory } from '@/hooks/useHistory';
import { useActiveTraining } from '@/hooks/useActiveTraining';
import { useStartTraining } from '@/hooks/useStartTraining';
import { useTheme } from '@/hooks/useTheme';
import { WorkoutRow } from '@/components/WorkoutRow';
import { PickerAnchor, SplitPicker } from '@/components/SplitPicker';
import { WeekStrip } from '@/components/WeekStrip';
import { useExercises } from '@/hooks/useExercises';
import { formatDaysAgo } from '@/utils/dates';
import { TrainingLog, Workout } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tactile } from '@/components/Tactile';
// Floating tab bar height plus its gap to the bottom edge (see app/(tabs)/_layout.tsx)
const TAB_BAR_OFFSET = 72 + 12;

/**
 * The workout after the last one completed in this split, wrapping around to the first. The
 * first workout before any session; none when that session's workout was deleted since.
 */
function nextWorkoutOf(workouts: Workout[], history: TrainingLog[], splitId: number): Workout | null {
  if (workouts.length === 0) return null;
  // History is newest first
  const last = history.find((log) => log.splitId === splitId && log.isCompleted);
  if (!last) return workouts[0];
  const index = workouts.findIndex((w) => w.id === last.workoutId);
  return index < 0 ? null : workouts[(index + 1) % workouts.length];
}

/** When each workout was last completed (history is newest first). */
function lastDoneByWorkout(history: TrainingLog[]): Map<number, number> {
  const last = new Map<number, number>();
  for (const log of history) {
    if (log.isCompleted && !last.has(log.workoutId)) {
      last.set(log.workoutId, new Date(log.completedAt ?? log.startedAt).getTime());
    }
  }
  return last;
}

const NEXT_UP_PREVIEW = 3;

export default function HomeScreen() {
  const router = useRouter();
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState<PickerAnchor | null>(null);
  const splitNameRef = useRef<View>(null);
  const chooseButtonRef = useRef<View>(null);
  const { splits, isLoading, isRefetching, refetch, activateSplit } = useSplits();
  const active = splits?.find((s) => s.isActive);
  const splitId = active?.id.toString() ?? '';
  const workoutsQuery = useWorkouts(splitId);
  const workouts = workoutsQuery.workouts ?? [];
  const { history, refetch: refetchHistory } = useHistory();
  const { activeTraining } = useActiveTraining();
  const next = active ? nextWorkoutOf(workouts, history, active.id) : null;
  const { startTraining, isPending: isStarting } = useStartTraining(next?.id.toString() ?? '', next?.name ?? '');
  const { exercises: nextExercises } = useExercises(next?.id.toString() ?? '');
  const lastDone = lastDoneByWorkout(history);

  const refresh = () => {
    void refetch();
    void refetchHistory();
    if (splitId) void workoutsQuery.refetch();
  };

  // Open the picker right under (or above) the control that was tapped
  const openPicker = (trigger: View | null) => {
    if (!trigger) return setPickerOpen(true);
    trigger.measureInWindow((_x, y, _width, height) => {
      setPickerAnchor({ y, height });
      setPickerOpen(true);
    });
  };

  const picker = (
    <SplitPicker
      visible={pickerOpen}
      anchor={pickerAnchor}
      splits={splits ?? []}
      onSelect={(split) => {
        setPickerOpen(false);
        if (!split.isActive) activateSplit.mutate(split.id);
      }}
      onManage={() => {
        setPickerOpen(false);
        router.push('/splits' as any);
      }}
      onClose={() => setPickerOpen(false)}
    />
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  // Nothing to train yet: explain what's missing and offer the one step that fixes it
  if (!active) {
    const hasSplits = (splits?.length ?? 0) > 0;
    return (
      <View className="flex-1 bg-base px-8 justify-center">
        <Ionicons name="barbell-outline" size={48} color={c.subtle} />
        <Text className="text-primary text-[32px] font-bold tracking-tighter leading-9 mt-4 mb-3">
          {hasSplits ? 'NO ACTIVE\nSPLIT' : 'NO SPLITS\nYET'}
        </Text>
        <Text className="text-muted text-sm leading-5 mb-6">
          {hasSplits
            ? 'Choose the split you are training with right now. Its workouts show up here, along with the one that is up next. You can switch at any time by tapping the split name.'
            : 'A split is your training program: the workout days you rotate through. Create one, add its workouts, and it shows up here.'}
        </Text>
        <Tactile
          ref={chooseButtonRef}
          className="rounded-md py-4 flex-row items-center justify-center gap-2"
          onPress={() => (hasSplits ? openPicker(chooseButtonRef.current) : router.push('/create-split'))}
          activeOpacity={0.85}
        >
          <Ionicons name={hasSplits ? 'flash' : 'add'} size={18} color={c.accentFg} />
          <Text className="text-accent-fg text-sm font-bold tracking-[2px]">
            {hasSplits ? 'CHOOSE A SPLIT' : 'CREATE A SPLIT'}
          </Text>
        </Tactile>
        {picker}
      </View>
    );
  }

  const header = (
    <View>
      <View className="px-2 pt-16 pb-4">
        <Text className="text-muted text-[10px] tracking-[4px] mb-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </Text>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            ref={splitNameRef}
            className="flex-row items-center gap-2 flex-1 mr-3"
            onPress={() => openPicker(splitNameRef.current)}
            accessibilityLabel={`${active.name}, tap to switch split`}
          >
            <Text className="text-primary text-[36px] font-bold tracking-tighter leading-10 flex-shrink" numberOfLines={1}>
              {active.name}
            </Text>
            <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={22} color={pickerOpen ? c.accent : c.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({ pathname: '/edit-split' as any, params: { splitId, currentName: active.name, currentBlock: String(active.currentBlock || 1) } })
            }
            accessibilityLabel="Edit split"
          >
            <Ionicons name="pencil-outline" size={18} color={c.muted} />
          </TouchableOpacity>
        </View>
        {active.currentBlock ? (
          <Text className="text-accent-text text-[10px] tracking-[2px] mt-1">BLOCK {active.currentBlock} OF 3</Text>
        ) : null}
      </View>

      <WeekStrip history={history} />

      {/* Resume the open session, else suggest the next workout */}
      {activeTraining ? (
        <View className="bg-surface rounded-md p-5 mb-6 border-2 border-b-[6px] border-accent">
          <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">IN PROGRESS</Text>
          <Text className="text-primary text-2xl font-bold tracking-tight mb-4">
            {activeTraining.workoutName || activeTraining.splitName}
          </Text>
          <Tactile
            className="rounded-md py-4 flex-row items-center justify-center gap-2"
            onPress={() => router.push({ pathname: '/training', params: { trainingLogId: activeTraining.id.toString() } })}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={18} color={c.accentFg} />
            <Text className="text-accent-fg text-sm font-bold tracking-[2px]">RESUME SESSION</Text>
          </Tactile>
        </View>
      ) : next ? (
        <View className="bg-surface border-2 border-edge border-b-[6px] rounded-md p-5 mb-6 gap-4">
          <View className="flex-row justify-between items-start gap-3">
            <View className="flex-1">
              <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">NEXT UP</Text>
              <Text className="text-primary text-2xl font-bold tracking-tight" numberOfLines={1}>{next.name}</Text>
            </View>
            <View className="items-end">
              <Text className="text-muted text-xs">
                {next.exerciseCount ?? 0} {next.exerciseCount === 1 ? 'exercise' : 'exercises'}
              </Text>
              <Text className="text-muted text-xs">
                {lastDone.has(next.id) ? `last done ${formatDaysAgo(lastDone.get(next.id)!)}` : 'not done yet'}
              </Text>
            </View>
          </View>
          {/* What's in it, before starting */}
          {(nextExercises?.length ?? 0) > 0 && (
            <View className="gap-2">
              {nextExercises!.slice(0, NEXT_UP_PREVIEW).map((e) => (
                <View key={e.id} className="flex-row justify-between items-center gap-3">
                  <Text className="text-primary text-sm flex-1" numberOfLines={1}>{e.name}</Text>
                  {e.sets != null && e.reps != null && (
                    <Text className="text-muted text-xs font-mono">
                      {e.sets} × {e.reps}{e.repUnit === 'seconds' ? 's' : ''}{e.plannedWeight ? ` · ${e.plannedWeight}` : ''}
                    </Text>
                  )}
                </View>
              ))}
              {nextExercises!.length > NEXT_UP_PREVIEW && (
                <Text className="text-muted text-xs">+ {nextExercises!.length - NEXT_UP_PREVIEW} more</Text>
              )}
            </View>
          )}
          <Tactile
            className={`rounded-md py-4 flex-row items-center justify-center gap-2 ${isStarting ? 'opacity-50' : ''}`}
            onPress={() => startTraining(next.exerciseCount ?? 0)}
            disabled={isStarting}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color={c.accentFg} />
            <Text className="text-accent-fg text-sm font-bold tracking-[2px]" numberOfLines={1}>
              {isStarting ? 'STARTING...' : `START ${next.name.toUpperCase()}`}
            </Text>
          </Tactile>
        </View>
      ) : null}

      {workouts.length > 0 && (
        <Text className="text-muted text-[10px] tracking-[4px] px-2 mb-3">ALL WORKOUTS</Text>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-base">
      <FlatList
        data={workouts}
        renderItem={({ item, index }) => (
          <WorkoutRow
            workout={item}
            index={index}
            splitId={splitId}
            onDelete={(id) => workoutsQuery.deleteWorkout.mutate(id)}
            lastDoneAt={lastDone.get(item.id)}
            isNext={!activeTraining && item.id === next?.id}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + TAB_BAR_OFFSET + 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={c.accent} />}
        ListEmptyComponent={
          workoutsQuery.isLoading ? null : (
            <View className="items-center mt-10 gap-3 px-6">
              <Ionicons name="calendar-outline" size={48} color={c.subtle} />
              <Text className="text-subtle text-xl font-bold tracking-[2px]">NO WORKOUT DAYS</Text>
              <Text className="text-dim text-sm text-center">Add the days of this split, then pick one to start training.</Text>
              <Tactile
                className="rounded-md px-6 py-3 flex-row items-center gap-2" containerClassName="mt-2"
                onPress={() => router.push({ pathname: '/create-workout', params: { splitId } })}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color={c.accentFg} />
                <Text className="text-accent-fg text-xs font-bold tracking-[2px]">ADD WORKOUT</Text>
              </Tactile>
            </View>
          )
        }
      />
      {picker}
    </View>
  );
}
