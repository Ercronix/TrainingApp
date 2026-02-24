import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { history, isLoading, isRefetching, refetch, deleteLog } = useHistory();

  const handleDelete = (id: number, workoutName: string) => {
    confirm(
      'Delete Session',
      `Delete the training session for "${workoutName}"? This cannot be undone.`,
      () => deleteLog.mutate(id),
      'Delete'
    );
  };

  const renderLogItem = ({ item }: { item: any }) => {
    const completedExercises = item.exercises?.filter((e: any) => e.completed).length ?? 0;
    const totalExercises = item.exercises?.length ?? 0;

    return (
      <TouchableOpacity
        className="bg-white rounded-xl mb-3 border border-gray-200 p-4"
        onPress={() =>
          router.push({
            pathname: '/history-detail' as any,
            params: { trainingLogId: item.id.toString() },
          })
        }
      >
        {/* Top row */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-lg font-bold text-gray-800">
              {item.workoutName || item.splitName}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {item.splitName} • {formatDate(item.startedAt)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id, item.workoutName || item.splitName);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500">{formatTime(item.startedAt)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="stopwatch-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500">{formatDuration(item.durationSeconds)}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="barbell-outline" size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-500">
              {completedExercises}/{totalExercises} exercises
            </Text>
          </View>
        </View>

        {/* Exercise pills */}
        <View className="flex-row flex-wrap gap-1">
          {item.exercises?.slice(0, 4).map((exercise: any) => (
            <View
              key={exercise.id}
              className={`px-2 py-0.5 rounded-full ${
                exercise.completed ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              <Text className={`text-xs ${exercise.completed ? 'text-green-700' : 'text-gray-500'}`}>
                {exercise.exerciseName}
              </Text>
            </View>
          ))}
          {item.exercises?.length > 4 && (
            <View className="px-2 py-0.5 rounded-full bg-gray-100">
              <Text className="text-xs text-gray-500">+{item.exercises.length - 4} more</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text className="text-xs text-gray-400 mt-2 italic">"{item.notes}"</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-500">Loading history...</Text>
      </View>
    );
  }

  const completedSessions = history.filter((l: any) => l.isCompleted);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-gray-800">Training History</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {completedSessions.length} session
          {completedSessions.length !== 1 ? 's' : ''} completed
        </Text>
      </View>

      <FlatList
        data={history}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Ionicons name="barbell-outline" size={48} color="#D1D5DB" />
            <Text className="text-xl text-gray-400 mt-4 mb-2">No training yet</Text>
            <Text className="text-sm text-gray-400">
              Complete your first session to see it here
            </Text>
          </View>
        }
      />
    </View>
  );
}
