import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '@/hooks/useDashboard';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, isLoading, isRefetching, refetch } = useDashboard();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const c = useTheme();

  const weekDays = [
    { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'S' }, { key: 'sun', label: 'S' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <Text className="text-accent-text text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  const lastSession = stats.lastSession;

  return (
    <ScrollView
      className="flex-1 bg-base"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.accent} />}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-accent-text text-[10px] tracking-[4px] mb-1">OVERVIEW</Text>
        <Text className="text-primary text-[40px] font-bold leading-[42px] tracking-tighter">
          PERFORMANCE{'\n'}STATS
        </Text>
      </View>

      {/* Streak Card */}
      <View className="mx-4 mb-3 bg-surface rounded-md p-6">
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-muted text-[10px] tracking-[3px] mb-1">CURRENT STREAK</Text>
            <View className="flex-row items-end gap-2">
              <Text className="text-primary text-[64px] font-bold leading-[68px] tracking-tighter">
                {stats.streak.current}
              </Text>
              <Text className="text-muted text-xs tracking-widest mb-2">DAYS</Text>
            </View>
          </View>
          <Ionicons name="flame" size={48} color={c.danger} />
        </View>

        {/* Week grid */}
        <View className="flex-row justify-between">
          {weekDays.map((day, index) => {
            const isTrained = stats.streak.last7Days[index];
            return (
              <View key={`${day.key}-${index}`} className="items-center gap-1">
                <Text className="text-muted text-[10px] tracking-widest">{day.label}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${isTrained ? 'bg-accent' : 'bg-elevated'}`}>
                  {isTrained && <Ionicons name="checkmark" size={12} color={c.accentFg} />}
                </View>
              </View>
            );
          })}
        </View>

        {stats.streak.longest > stats.streak.current && (
          <Text className="text-muted text-xs mt-4">Best: {stats.streak.longest} days</Text>
        )}
      </View>

      {/* Time Range Toggle */}
      <View className="flex-row mx-4 mb-3 bg-surface rounded-md p-1">
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            className={`flex-1 py-2.5 rounded-sm items-center ${timeRange === range ? 'bg-accent' : ''}`}
            onPress={() => setTimeRange(range)}
          >
            <Text className={`text-[11px] font-bold tracking-widest ${timeRange === range ? 'text-accent-fg' : 'text-muted'}`}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap mx-3 mb-3 gap-1">
        <View className="bg-surface rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="barbell-outline" size={20} color={c.accent} />
          <Text className="text-accent-text text-[28px] font-bold tracking-tighter">{stats.sessions[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">SESSIONS</Text>
        </View>

        <View className="bg-elevated rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="fitness-outline" size={20} color={c.info} />
          <Text className="text-info text-[28px] font-bold tracking-tighter">{stats.volume[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">KG VOLUME</Text>
        </View>

        <View className="bg-surface rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="time-outline" size={20} color={c.danger} />
          <Text className="text-danger text-[28px] font-bold tracking-tighter">{stats.time[timeRange]}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">TIME TRAINED</Text>
        </View>

        <View className="bg-elevated rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="trending-up-outline" size={20} color={c.accent} />
          <Text className="text-accent-text text-[28px] font-bold tracking-tighter">{stats.averageVolume}</Text>
          <Text className="text-muted text-[9px] tracking-[2px]">AVG / SESSION</Text>
        </View>
      </View>

      {/* Last Session */}
      {lastSession && (
        <TouchableOpacity
          className="mx-4 mb-3 bg-surface rounded-md p-5"
          onPress={() =>
            router.push({ pathname: '/history-detail', params: { trainingLogId: lastSession.id.toString() } })
          }
          activeOpacity={0.85}
        >
          <Text className="text-muted text-[9px] tracking-[3px] mb-3">LAST SESSION</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-primary text-xl font-bold tracking-tight mb-1">
                {lastSession.workoutName || lastSession.splitName}
              </Text>
              <Text className="text-muted text-xs">
                {new Date(lastSession.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long', day: 'numeric', month: 'long',
                })} · {lastSession.exercises?.length || 0} exercises
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.muted} />
          </View>
        </TouchableOpacity>
      )}

      {/* Most Active Day */}
      {stats.mostActiveDay && (
        <View className="mx-4 mb-10 bg-surface rounded-md p-5">
          <Text className="text-muted text-[9px] tracking-[3px] mb-3">MOST ACTIVE DAY</Text>
          <View className="flex-row items-end justify-between">
            <Text className="text-primary text-[28px] font-bold tracking-tight">{stats.mostActiveDay}</Text>
            <Text className="text-muted text-xs mb-1">
              {(stats.sessionsByDay[stats.mostActiveDay as keyof typeof stats.sessionsByDay]) || 0} sessions
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
