import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '@/hooks/useHistory';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { TrainingLog } from '@/types';

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

type DateFilter = 'all' | 'week' | 'month' | '3months';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'week', label: '7D' },
  { key: 'month', label: '30D' },
  { key: '3months', label: '90D' },
];

function getDateThreshold(filter: DateFilter): Date | null {
  if (filter === 'all') return null;
  const now = new Date();
  const days = filter === 'week' ? 7 : filter === 'month' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export default function HistoryScreen() {
  const router = useRouter();
  const { history, isLoading, isRefetching, refetch, deleteLog } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredHistory = useMemo(() => {
    let filtered = history;

    // Date filter
    const threshold = getDateThreshold(dateFilter);
    if (threshold) {
      filtered = filtered.filter((item: TrainingLog) => new Date(item.startedAt) >= threshold);
    }

    // Search filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((item: TrainingLog) => {
        const matchesWorkout = item.workoutName?.toLowerCase().includes(query);
        const matchesSplit = item.splitName?.toLowerCase().includes(query);
        const matchesExercise = item.exercises?.some(
          (e) => e.exerciseName?.toLowerCase().includes(query)
        );
        return matchesWorkout || matchesSplit || matchesExercise;
      });
    }

    return filtered;
  }, [history, searchQuery, dateFilter]);

  const handleDelete = (id: number, workoutName: string) => {
    confirm('Delete Session', `Delete the training session for "${workoutName}"? This cannot be undone.`,
      () => deleteLog.mutate(id), 'Delete');
  };

  const renderLogItem = ({ item, index }: { item: TrainingLog; index: number }) => {
    const completedExercises = item.exercises?.filter((e) => e.completed).length ?? 0;
    const totalExercises = item.exercises?.length ?? 0;
    const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

    return (
      <SwipeableRow
        rightActions={[
          {
            icon: 'trash-outline',
            color: '#ff734a',
            backgroundColor: '#2a1410',
            label: 'DELETE',
            onPress: () => handleDelete(item.id, item.workoutName || item.splitName),
          },
        ]}
      >
        <TouchableOpacity
          className="bg-[#131313] rounded-md p-5"
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
              <Text className="text-[#7a7a7a] text-[11px] tracking-wider">
                {item.splitName} · {formatDate(item.startedAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#262626" />
          </View>

          {/* Stats row */}
          <View className="flex-row items-center bg-[#0e0e0e] rounded p-3 mb-3">
            <View className="flex-1 items-center">
              <Text className="text-[#f5f5f5] text-sm font-bold tracking-tight">{formatTime(item.startedAt)}</Text>
              <Text className="text-[#7a7a7a] text-[8px] tracking-widest mt-0.5">TIME</Text>
            </View>
            <View className="w-px h-7 bg-[#1a1a1a]" />
            <View className="flex-1 items-center">
              <Text className="text-[#f5f5f5] text-sm font-bold tracking-tight">{formatDuration(item.durationSeconds)}</Text>
              <Text className="text-[#7a7a7a] text-[8px] tracking-widest mt-0.5">DURATION</Text>
            </View>
            <View className="w-px h-7 bg-[#1a1a1a]" />
            <View className="flex-1 items-center">
              <Text className={`text-sm font-bold tracking-tight ${completionRate === 100 ? 'text-[#cafd00]' : 'text-[#f5f5f5]'}`}>
                {completionRate}%
              </Text>
              <Text className="text-[#7a7a7a] text-[8px] tracking-widest mt-0.5">DONE</Text>
            </View>
          </View>

          {/* Exercise pills */}
          <View className="flex-row flex-wrap gap-1">
            {item.exercises?.slice(0, 4).map((exercise) => (
              <View
                key={exercise.id}
                className={`px-2 py-1 rounded-sm ${exercise.completed ? 'bg-[#cafd00]/10' : 'bg-[#1a1a1a]'}`}
              >
                <Text className={`text-[10px] ${exercise.completed ? 'text-[#cafd00]' : 'text-[#7a7a7a]'}`}>
                  {exercise.exerciseName}
                </Text>
              </View>
            ))}
            {item.exercises?.length > 4 && (
              <View className="px-2 py-1 rounded-sm bg-[#1a1a1a]">
                <Text className="text-[10px] text-[#7a7a7a]">+{item.exercises.length - 4}</Text>
              </View>
            )}
          </View>

          {item.notes && (
            <Text className="text-[#3a3a3a] text-xs italic mt-2">"{item.notes}"</Text>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedSessions = history.filter((l: TrainingLog) => l.isCompleted);

  return (
    <View className="flex-1 bg-[#0e0e0e]">
      <View className="px-6 pt-16 pb-4">
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

      {/* Search bar */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-[#131313] rounded-md px-4 py-3">
          <Ionicons name="search" size={16} color="#7a7a7a" />
          <TextInput
            className="flex-1 text-[#f5f5f5] text-sm ml-3"
            placeholder="Search workouts, exercises..."
            placeholderTextColor="#3a3a3a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#7a7a7a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date filter pills */}
      <View className="flex-row px-4 mb-3 gap-2">
        {DATE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setDateFilter(f.key)}
            className={`px-4 py-2 rounded-md ${dateFilter === f.key ? 'bg-[#cafd00]' : 'bg-[#131313]'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-[10px] font-bold tracking-[2px] ${
                dateFilter === f.key ? 'text-[#0e0e0e]' : 'text-[#7a7a7a]'
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredHistory}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" />}
        ListEmptyComponent={
          <View className="items-center mt-20 gap-3">
            <Ionicons name={searchQuery || dateFilter !== 'all' ? 'search-outline' : 'barbell-outline'} size={48} color="#262626" />
            <Text className="text-[#262626] text-xl font-bold tracking-[2px]">
              {searchQuery || dateFilter !== 'all' ? 'NO RESULTS' : 'NO SESSIONS YET'}
            </Text>
            <Text className="text-[#3a3a3a] text-sm">
              {searchQuery || dateFilter !== 'all' ? 'Try a different search or filter' : 'Complete your first training session'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
