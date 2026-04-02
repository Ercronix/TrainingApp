import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDashboard } from '@/hooks/useDashboard';
import { useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const { stats, isLoading, isRefetching, refetch } = useDashboard();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const weekDays = [
    { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'S' }, { key: 'sun', label: 'S' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0e0e0e]">
        <Text className="text-[#cafd00] text-sm font-bold tracking-[4px]">LOADING...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#0e0e0e]"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#cafd00" />}
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-[#cafd00] text-[10px] tracking-[4px] mb-1">OVERVIEW</Text>
        <Text className="text-[#f5f5f5] text-[40px] font-bold leading-[42px] tracking-tighter">
          PERFORMANCE{'\n'}STATS
        </Text>
      </View>

      {/* Streak Card */}
      <View className="mx-4 mb-3 bg-[#131313] rounded-md p-6">
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-[#7a7a7a] text-[10px] tracking-[3px] mb-1">CURRENT STREAK</Text>
            <View className="flex-row items-end gap-2">
              <Text className="text-[#f5f5f5] text-[64px] font-bold leading-[68px] tracking-tighter">
                {stats.streak.current}
              </Text>
              <Text className="text-[#7a7a7a] text-xs tracking-widest mb-2">DAYS</Text>
            </View>
          </View>
          <Ionicons name="flame" size={48} color="#ff734a" />
        </View>

        {/* Week grid */}
        <View className="flex-row justify-between">
          {weekDays.map((day, index) => {
            const isTrained = stats.streak.last7Days[index];
            return (
              <View key={`${day.key}-${index}`} className="items-center gap-1">
                <Text className="text-[#7a7a7a] text-[10px] tracking-widest">{day.label}</Text>
                <View className={`w-8 h-8 rounded-full items-center justify-center ${isTrained ? 'bg-[#cafd00]' : 'bg-[#1a1a1a]'}`}>
                  {isTrained && <Ionicons name="checkmark" size={12} color="#0e0e0e" />}
                </View>
              </View>
            );
          })}
        </View>

        {stats.streak.longest > stats.streak.current && (
          <Text className="text-[#7a7a7a] text-xs mt-4">Best: {stats.streak.longest} days</Text>
        )}
      </View>

      {/* Time Range Toggle */}
      <View className="flex-row mx-4 mb-3 bg-[#131313] rounded-md p-1">
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            className={`flex-1 py-2.5 rounded-sm items-center ${timeRange === range ? 'bg-[#cafd00]' : ''}`}
            onPress={() => setTimeRange(range)}
          >
            <Text className={`text-[11px] font-bold tracking-widest ${timeRange === range ? 'text-[#0e0e0e]' : 'text-[#7a7a7a]'}`}>
              {range.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap mx-3 mb-3 gap-1">
        <View className="bg-[#131313] rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="barbell-outline" size={20} color="#cafd00" />
          <Text className="text-[#cafd00] text-[28px] font-bold tracking-tighter">{stats.sessions[timeRange]}</Text>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[2px]">SESSIONS</Text>
        </View>

        <View className="bg-[#1a1a1a] rounded-md p-5 gap-1.5" style={{ width: '48.5%' }}>
          <Ionicons name="fitness-outline" size={20} color="#81ecff" />
          <Text className="text-[#81ecff] text-[28px] font-bold tracking-tighter">{stats.volume[timeRange]}</Text>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[2px]">KG VOLUME</Text>
        </View>

        <View className="bg-[#131313] rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="time-outline" size={20} color="#ff734a" />
          <Text className="text-[#ff734a] text-[28px] font-bold tracking-tighter">{stats.time[timeRange]}</Text>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[2px]">TIME TRAINED</Text>
        </View>

        <View className="bg-[#1a1a1a] rounded-md p-5 gap-1.5 mt-1" style={{ width: '48.5%' }}>
          <Ionicons name="trending-up-outline" size={20} color="#cafd00" />
          <Text className="text-[#cafd00] text-[28px] font-bold tracking-tighter">{stats.averageVolume}</Text>
          <Text className="text-[#7a7a7a] text-[9px] tracking-[2px]">AVG / SESSION</Text>
        </View>
      </View>

      {/* Last Session */}
      {stats.lastSession && (
        <TouchableOpacity
          className="mx-4 mb-3 bg-[#131313] rounded-md p-5"
          onPress={() =>
            router.push({ pathname: '/history-detail', params: { trainingLogId: stats.lastSession.id.toString() } })
          }
          activeOpacity={0.85}
        >
          <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-3">LAST SESSION</Text>
          <View className="flex-row justify-between items-center">
            <View className="flex-1 mr-2">
              <Text className="text-[#f5f5f5] text-xl font-bold tracking-tight mb-1">
                {stats.lastSession.workoutName || stats.lastSession.splitName}
              </Text>
              <Text className="text-[#7a7a7a] text-xs">
                {new Date(stats.lastSession.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long', day: 'numeric', month: 'long',
                })} · {stats.lastSession.exercises?.length || 0} exercises
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7a7a7a" />
          </View>
        </TouchableOpacity>
      )}

      {/* Most Active Day */}
      {stats.mostActiveDay && (
        <View className="mx-4 mb-10 bg-[#131313] rounded-md p-5">
          <Text className="text-[#7a7a7a] text-[9px] tracking-[3px] mb-3">MOST ACTIVE DAY</Text>
          <View className="flex-row items-end justify-between">
            <Text className="text-[#f5f5f5] text-[28px] font-bold tracking-tight">{stats.mostActiveDay}</Text>
            <Text className="text-[#7a7a7a] text-xs mb-1">
              {(stats.sessionsByDay[stats.mostActiveDay as keyof typeof stats.sessionsByDay]) || 0} sessions
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
