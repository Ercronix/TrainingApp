import { View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHistory } from '@/hooks/useHistory';
import { isInProgress } from '@/hooks/useActiveTraining';
import { confirm } from '@/utils/confirm';
import SwipeableRow from '@/components/SwipeableRow';
import { TrainingLog } from '@/types';
import { useTheme } from '@/hooks/useTheme';

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
  const c = useTheme();

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
            color: c.danger,
            backgroundColor: c.dangerMuted,
            label: 'DELETE',
            onPress: () => handleDelete(item.id, item.workoutName || item.splitName),
          },
        ]}
      >
        <TouchableOpacity
          className="bg-surface rounded-l-md p-5"
          onPress={() =>
            // Sessions still in progress reopen in the training screen so they can be continued
            router.push({
              pathname: isInProgress(item) ? '/training' : '/history-detail' as any,
              params: { trainingLogId: item.id.toString() },
            })
          }
          activeOpacity={0.85}
        >
          {/* Top row */}
          <View className="flex-row items-start mb-4 gap-3">
            <Text className="text-subtle text-xl font-mono-bold tracking-tight min-w-[28px]">
              {String(index + 1).padStart(2, '0')}
            </Text>
            <View className="flex-1">
              <Text className="text-primary text-lg font-bold tracking-tight mb-0.5">
                {item.workoutName || item.splitName}
              </Text>
              <Text className="text-muted text-[11px] tracking-wider">
                {item.splitName} · {formatDate(item.startedAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.subtle} />
          </View>

          {/* Stats row */}
          <View className="flex-row items-center bg-base rounded p-3 mb-3">
            <View className="flex-1 items-center">
              <Text className="text-primary text-sm font-bold tracking-tight">{formatTime(item.startedAt)}</Text>
              <Text className="text-muted text-[8px] tracking-widest mt-0.5">TIME</Text>
            </View>
            <View className="w-px h-7 bg-elevated" />
            <View className="flex-1 items-center">
              <Text className="text-primary text-sm font-bold tracking-tight">{formatDuration(item.durationSeconds)}</Text>
              <Text className="text-muted text-[8px] tracking-widest mt-0.5">DURATION</Text>
            </View>
            <View className="w-px h-7 bg-elevated" />
            <View className="flex-1 items-center">
              <Text className={`text-sm font-bold tracking-tight ${completionRate === 100 ? 'text-accent-text' : 'text-primary'}`}>
                {completionRate}%
              </Text>
              <Text className="text-muted text-[8px] tracking-widest mt-0.5">DONE</Text>
            </View>
          </View>

          {/* Exercise pills */}
          <View className="flex-row flex-wrap gap-1">
            {item.exercises?.slice(0, 4).map((exercise) => (
              <View
                key={exercise.id}
                className={`px-2 py-1 rounded-sm ${exercise.completed ? 'bg-accent/10' : 'bg-elevated'}`}
              >
                <Text className={`text-[10px] ${exercise.completed ? 'text-accent-text' : 'text-muted'}`}>
                  {exercise.exerciseName}
                </Text>
              </View>
            ))}
            {item.exercises?.length > 4 && (
              <View className="px-2 py-1 rounded-sm bg-elevated">
                <Text className="text-[10px] text-muted">+{item.exercises.length - 4}</Text>
              </View>
            )}
          </View>

          {item.notes && (
            <Text className="text-subtle text-xs italic mt-2">"{item.notes}"</Text>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const completedSessions = history.filter((l: TrainingLog) => l.isCompleted);

  return (
    <View className="flex-1 bg-base">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">YOUR LOGS</Text>
        <View className="flex-row items-end justify-between">
          <Text className="text-primary text-[40px] font-bold leading-[42px] tracking-tighter">
            TRAINING{'\n'}HISTORY
          </Text>
          <Text className="text-dim text-[64px] font-bold tracking-tighter leading-[68px] mb-0.5">
            {completedSessions.length}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View className="px-4 mb-3">
        <View className="flex-row items-center bg-surface rounded-md px-4 py-3">
          <Ionicons name="search" size={16} color={c.muted} />
          <TextInput
            className="flex-1 text-primary text-sm ml-3"
            placeholder="Search workouts, exercises..."
            placeholderTextColor={c.subtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardAppearance="dark"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={c.muted} />
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
            className={`px-4 py-2 rounded-md ${dateFilter === f.key ? 'bg-accent' : 'bg-surface'}`}
            activeOpacity={0.8}
          >
            <Text
              className={`text-[10px] font-bold tracking-[2px] ${
                dateFilter === f.key ? 'text-accent-fg' : 'text-muted'
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
        ListEmptyComponent={
          <View className="items-center mt-20 gap-3">
            <Ionicons name={searchQuery || dateFilter !== 'all' ? 'search-outline' : 'barbell-outline'} size={48} color={c.subtle} />
            <Text className="text-subtle text-xl font-bold tracking-[2px]">
              {searchQuery || dateFilter !== 'all' ? 'NO RESULTS' : 'NO SESSIONS YET'}
            </Text>
            <Text className="text-dim text-sm">
              {searchQuery || dateFilter !== 'all' ? 'Try a different search or filter' : 'Complete your first training session'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
