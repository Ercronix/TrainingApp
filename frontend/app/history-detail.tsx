import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTraining } from '@/hooks/useTraining';
import { useHistory } from '@/hooks/useHistory';
import { confirm } from '@/utils/confirm';
import { ExerciseLog } from '@/types';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryDetailScreen() {
  const { trainingLogId } = useLocalSearchParams<{ trainingLogId: string }>();
  const router = useRouter();
  const { training, isLoading } = useTraining(trainingLogId);
  const { deleteLog } = useHistory();

  const handleDelete = () => {
    confirm('Delete Session', 'Delete this training session? This cannot be undone.',
      () => deleteLog.mutate(Number(trainingLogId), { onSuccess: () => router.back() }), 'Delete');
  };

  const renderExerciseItem = ({ item, index }: { item: ExerciseLog; index: number }) => (
    <View className={`rounded-md mb-2 overflow-hidden relative ${item.completed ? 'bg-[#0d1408]' : 'bg-[#131313]'}`}>
      {item.completed && <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#cafd00]" />}
      <View className="flex-row items-start px-5 py-4 gap-3">
        <Text className="text-[#1a1a1a] text-xl font-bold tracking-tight min-w-[28px]">
          {String(index + 1).padStart(2, '0')}
        </Text>
        <View className="flex-1">
          <Text className="text-[#f5f5f5] text-sm font-bold tracking-tight mb-1">{item.exerciseName}</Text>
          {item.plannedSets && item.plannedReps && (
            <Text className="text-[#7a7a7a] text-[10px] tracking-widest">
              PLANNED: {item.plannedSets} × {item.plannedReps}{item.plannedWeight ? ` @ ${item.plannedWeight} kg` : ''}
            </Text>
          )}
          {item.completed && (
            <Text className="text-[#cafd00] text-[11px] tracking-wider mt-0.5">
              ✓ DONE: {item.setsCompleted} × {item.repsCompleted}{item.weightUsed ? ` @ ${item.weightUsed} kg` : ''}
            </Text>
          )}
          {item.notes && (
            <Text className="text-[#3a3a3a] text-[11px] italic mt-1">"{item.notes}"</Text>
          )}
        </View>
        <View className={`w-5 h-5 rounded-full justify-center items-center mt-0.5 ${item.completed ? 'bg-[#cafd00]' : 'border border-[#2a2a2a]'}`}>
          {item.completed && <Ionicons name="checkmark" size={10} color="#0e0e0e" />}
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedCount = training?.exercises?.filter((e: ExerciseLog) => e.completed).length ?? 0;
  const totalCount = training?.exercises?.length ?? 0;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      {/* Header */}
      <View className="px-6 pt-14 pb-5">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#cafd00" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color="#ff734a" />
          </TouchableOpacity>
        </View>
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">SESSION LOG</Text>
        <Text className="text-[#f5f5f5] text-[32px] font-bold tracking-tighter mb-1">
          {training?.workoutName || training?.splitName}
        </Text>
        {training?.splitName && (
          <Text className="text-[#7a7a7a] text-sm mb-0.5">{training.splitName}</Text>
        )}
        {training?.startedAt && (
          <Text className="text-[#3a3a3a] text-xs">
            {formatDate(training.startedAt)} · {formatTime(training.startedAt)}
          </Text>
        )}
      </View>

      {/* Stats row */}
      <View className="flex-row mx-4 mb-3 bg-[#131313] rounded-md py-4">
        <View className="flex-1 items-center">
          <Text className="text-[#f5f5f5] text-[22px] font-bold tracking-tight mb-0.5">
            {formatDuration(training?.durationSeconds)}
          </Text>
          <Text className="text-[#7a7a7a] text-[8px] tracking-[2px]">DURATION</Text>
        </View>
        <View className="w-px bg-[#1a1a1a] my-1" />
        <View className="flex-1 items-center">
          <Text className="text-[#f5f5f5] text-[22px] font-bold tracking-tight mb-0.5">
            {completedCount}/{totalCount}
          </Text>
          <Text className="text-[#7a7a7a] text-[8px] tracking-[2px]">COMPLETED</Text>
        </View>
        <View className="w-px bg-[#1a1a1a] my-1" />
        <View className="flex-1 items-center">
          <Text className={`text-[22px] font-bold tracking-tight mb-0.5 ${completionRate === 100 ? 'text-[#cafd00]' : 'text-[#f5f5f5]'}`}>
            {completionRate}%
          </Text>
          <Text className="text-[#7a7a7a] text-[8px] tracking-[2px]">RATE</Text>
        </View>
      </View>

      {/* Session notes */}
      {training?.notes && (
        <View className="mx-4 mb-3 bg-[#131313] rounded-md p-4">
          <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-2">SESSION NOTES</Text>
          <Text className="text-[#adaaaa] text-sm leading-5">{training.notes}</Text>
        </View>
      )}

      <FlatList
        data={training?.exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-3">EXERCISES</Text>
        }
      />
    </View>
  );
}
