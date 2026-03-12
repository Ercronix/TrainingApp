import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { useHistory } from '@/hooks/useHistory';
import { confirm } from '@/utils/confirm';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryDetailScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const { training, isLoading } = useTraining(trainingLogId);
  const { deleteLog } = useHistory();

  const handleDelete = () => {
    confirm(
      'Delete Session',
      `Delete this training session? This cannot be undone.`,
      () =>
        deleteLog.mutate(Number(trainingLogId), {
          onSuccess: () => router.back(),
        }),
      'Delete'
    );
  };

  const renderExerciseItem = ({ item }: { item: any }) => (
    <View
      className={`bg-slate-900 rounded-xl mb-3 border p-4 ${
        item.completed ? 'border-blue-700/60' : 'border-slate-800'
      }`}
    >
      <View className="flex-row items-start">
        <View className="mt-0.5 mr-2">
          {item.completed ? (
            <Ionicons name="checkmark-circle" size={18} color="#60A5FA" />
          ) : (
            <Ionicons name="ellipse-outline" size={18} color="#64748B" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-100 mb-1">
            {item.exerciseName}
          </Text>

          {item.plannedSets && item.plannedReps && (
            <Text className="text-xs text-slate-500">
              Planned: {item.plannedSets} × {item.plannedReps} reps
              {item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
            </Text>
          )}

          {item.completed && (
            <Text className="text-sm text-blue-200 font-medium mt-0.5">
              Done: {item.setsCompleted} × {item.repsCompleted} reps
              {item.weightUsed ? ` @ ${item.weightUsed} kg` : ''}
            </Text>
          )}

          {item.notes && (
            <Text className="text-xs text-slate-500 italic mt-1">"{item.notes}"</Text>
          )}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <Text className="text-slate-400">Loading session...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises?.filter((e: any) => e.completed).length ?? 0;
  const totalCount = training?.exercises?.length ?? 0;

  return (
    <View className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <View className="flex-row justify-between items-center mb-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-blue-400 text-base">← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        {/* Main title - Workout name */}
        <Text className="text-2xl font-bold text-slate-100">
          {training?.workoutName || training?.splitName}
        </Text>
        
        {/* Subtitle - Split name and date */}
        {training?.splitName && (
          <Text className="text-sm text-slate-400 mt-1">
            {training.splitName} • {training?.startedAt ? formatDate(training.startedAt) : ''}
          </Text>
        )}
        
        {/* Time */}
        {training?.startedAt && (
          <Text className="text-sm text-slate-500 mt-1">
            {formatTime(training.startedAt)}
          </Text>
        )}
      </View>

      {/* Stats bar */}
      <View className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex-row gap-6">
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-100">
            {formatDuration(training?.durationSeconds)}
          </Text>
          <Text className="text-xs text-slate-500">Duration</Text>
        </View>
        <View className="w-px bg-slate-800" />
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-100">
            {completedCount}/{totalCount}
          </Text>
          <Text className="text-xs text-slate-500">Completed</Text>
        </View>
        <View className="w-px bg-slate-800" />
        <View className="items-center">
          <Text className="text-lg font-bold text-slate-100">
            {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
          </Text>
          <Text className="text-xs text-slate-500">Rate</Text>
        </View>
      </View>

      {/* Session notes */}
      {training?.notes && (
        <View className="mx-4 mt-3 bg-slate-900 rounded-xl p-4 border border-slate-800">
          <Text className="text-xs font-semibold text-slate-500 mb-1">SESSION NOTES</Text>
          <Text className="text-sm text-slate-200">{training.notes}</Text>
        </View>
      )}

      {/* Exercise list */}
      <FlatList
        data={training?.exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View className="mb-3">
            <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              EXERCISES
            </Text>
          </View>
        }
      />
    </View>
  );
}
