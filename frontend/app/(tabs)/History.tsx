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
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen() {
  const router = useRouter();
  const { history, isLoading, isRefetching, refetch, deleteLog } = useHistory();

  const handleDelete = (id: number, workoutName: string) => {
    confirm('Delete Session', `Delete the training session for "${workoutName}"? This cannot be undone.`,
      () => deleteLog.mutate(id), 'Delete');
  };

  const renderLogItem = ({ item, index }: { item: any; index: number }) => {
    const completedExercises = item.exercises?.filter((e: any) => e.completed).length ?? 0;
    const totalExercises = item.exercises?.length ?? 0;
    const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    return (
      <TouchableOpacity
        className="bg-[#131313] rounded-md mb-2 p-5"
        onPress={() =>
          router.push({ pathname: '/history-detail' as any, params: { trainingLogId: item.id.toString() } })
        }
        activeOpacity={0.85}
      >
        {/* Top row */}
        <View className="flex-row items-start mb-4 gap-3">
          <Text className="text-[#262626] text-xl font-bold tracking-tight min-w-[28px]">
            {String(index + 1).padStart(2, '0')}
          </Text>
          <View className="flex-1">
            <Text className="text-[#f5f5f5] text-lg font-bold tracking-tight mb-0.5">
              {item.workoutName || item.splitName}
            </Text>
            <Text className="text-[#4a4a4a] text-[11px] tracking-wider">
              {item.splitName} · {formatDate(item.startedAt)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); handleDelete(item.id, item.workoutName || item.splitName); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color="#ff734a" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View className="flex-row items-center bg-[#0e0e0e] rounded p-3 mb-3">
          <View className="flex-1 items-center">
            <Text className="text-[#f5f5f5] text-sm font-bold tracking-tight">{formatTime(item.startedAt)}</Text>
            <Text className="text-[#4a4a4a] text-[8px] tracking-widest mt-0.5">TIME</Text>
          </View>
          <View className="w-px h-7 bg-[#1a1a1a]" />
          <View className="flex-1 items-center">
            <Text className="text-[#f5f5f5] text-sm font-bold tracking-tight">{formatDuration(item.durationSeconds)}</Text>
            <Text className="text-[#4a4a4a] text-[8px] tracking-widest mt-0.5">DURATION</Text>
          </View>
          <View className="w-px h-7 bg-[#1a1a1a]" />
          <View className="flex-1 items-center">
            <Text className={`text-sm font-bold tracking-tight ${completionRate === 100 ? 'text-[#cafd00]' : 'text-[#f5f5f5]'}`}>
              {completionRate}%
            </Text>
            <Text className="text-[#4a4a4a] text-[8px] tracking-widest mt-0.5">DONE</Text>
          </View>
        </View>

        {/* Exercise pills */}
        <View className="flex-row flex-wrap gap-1">
          {item.exercises?.slice(0, 4).map((exercise: any) => (
            <View
              key={exercise.id}
              className={`px-2 py-1 rounded-sm ${exercise.completed ? 'bg-[#cafd00]/10' : 'bg-[#1a1a1a]'}`}
            >
              <Text className={`text-[10px] ${exercise.completed ? 'text-[#cafd00]' : 'text-[#4a4a4a]'}`}>
                {exercise.exerciseName}
              </Text>
            </View>
          ))}
          {item.exercises?.length > 4 && (
            <View className="px-2 py-1 rounded-sm bg-[#1a1a1a]">
              <Text className="text-[10px] text-[#4a4a4a]">+{item.exercises.length - 4}</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text className="text-[#3a3a3a] text-xs italic mt-2">"{item.notes}"</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedSessions = history.filter((l: any) => l.isCompleted);

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">YOUR LOGS</Text>
        <View className="flex-row items-end justify-between">
          <Text className="text-[#f5f5f5] text-[40px] font-bold leading-[42px] tracking-tighter">
            TRAINING{'\n'}HISTORY
          </Text>
          <Text className="text-[#1a1a1a] text-[64px] font-bold tracking-tighter leading-[68px] mb-0.5">
            {completedSessions.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={history}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" />}
        ListEmptyComponent={
          <View className="items-center mt-20 gap-3">
            <Ionicons name="barbell-outline" size={48} color="#262626" />
            <Text className="text-[#262626] text-xl font-bold tracking-[2px]">NO SESSIONS YET</Text>
            <Text className="text-[#3a3a3a] text-sm">Complete your first training session</Text>
          </View>
        }
      />
    </View>
  );
}
