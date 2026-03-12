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
    { key: 'mon', label: 'M' },
    { key: 'tue', label: 'T' },
    { key: 'wed', label: 'W' },
    { key: 'thu', label: 'T' },
    { key: 'fri', label: 'F' },
    { key: 'sat', label: 'S' },
    { key: 'sun', label: 'S' }
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <Text className="text-slate-400">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-slate-950"
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Header */}
      <View className="bg-slate-900 border-b border-slate-800 pt-12 pb-4 px-6">
        <Text className="text-2xl font-bold text-slate-100">Dashboard</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Your training overview
        </Text>
      </View>

      {/* Streak Card */}
      <View className="mx-4 mt-4 bg-slate-900 rounded-xl p-6 border border-slate-800">
        <View className="flex-row items-center mb-4">
          <View className="bg-orange-950/50 border border-orange-900/40 p-3 rounded-full mr-3">
            <Ionicons name="flame" size={24} color="#F97316" />
          </View>
          <View>
            <Text className="text-sm text-slate-400">Current Streak</Text>
            <Text className="text-3xl font-bold text-slate-100">
              {stats.streak.current} <Text className="text-base font-normal text-slate-500">days</Text>
            </Text>
          </View>
        </View>
        
        {/* Streak days visualization */}
        <View className="flex-row justify-between items-center">
          {weekDays.map((day, index) => {
            const isTrained = stats.streak.last7Days[index];
            return (
              <View key={`${day.key}-${index}`} className="items-center">
                <Text className="text-xs text-slate-500 mb-1">{day.label}</Text>
                <View 
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isTrained ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  {isTrained && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </View>
            );
          })}
        </View>
        
        {stats.streak.longest > stats.streak.current && (
          <Text className="text-xs text-slate-500 mt-3">
            Longest streak: {stats.streak.longest} days
          </Text>
        )}
      </View>

      {/* Time Range Selector */}
      <View className="flex-row mx-4 mt-4 bg-slate-900 rounded-lg p-1 border border-slate-800">
        {(['week', 'month', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            className={`flex-1 py-2 rounded-md ${timeRange === range ? 'bg-blue-600' : ''}`}
            onPress={() => setTimeRange(range)}
          >
            <Text 
              className={`text-center text-sm font-medium ${
                timeRange === range ? 'text-white' : 'text-slate-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap mx-4 mt-4">
        {/* Sessions Card */}
        <View className="w-1/2 p-1">
          <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Ionicons name="barbell-outline" size={24} color="#60A5FA" />
            <Text className="text-2xl font-bold text-slate-100 mt-2">
              {stats.sessions[timeRange]}
            </Text>
            <Text className="text-sm text-slate-400">Sessions</Text>
          </View>
        </View>

        {/* Volume Card */}
        <View className="w-1/2 p-1">
          <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Ionicons name="fitness-outline" size={24} color="#60A5FA" />
            <Text className="text-2xl font-bold text-slate-100 mt-2">
              {stats.volume[timeRange]} kg
            </Text>
            <Text className="text-sm text-slate-400">Total Volume</Text>
          </View>
        </View>

        {/* Time Card */}
        <View className="w-1/2 p-1 mt-2">
          <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Ionicons name="time-outline" size={24} color="#60A5FA" />
            <Text className="text-2xl font-bold text-slate-100 mt-2">
              {stats.time[timeRange]}
            </Text>
            <Text className="text-sm text-slate-400">Time Trained</Text>
          </View>
        </View>

        {/* Avg Session Card */}
        <View className="w-1/2 p-1 mt-2">
          <View className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <Ionicons name="stats-chart-outline" size={24} color="#60A5FA" />
            <Text className="text-2xl font-bold text-slate-100 mt-2">
              {stats.averageVolume} kg
            </Text>
            <Text className="text-sm text-slate-400">Avg / Session</Text>
          </View>
        </View>
      </View>

      {/* Last Session Card */}
      {stats.lastSession && (
        <TouchableOpacity
          className="mx-4 mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800"
          onPress={() => {
            if (stats.lastSession) {
              router.push({
                pathname: '/history-detail',
                params: { trainingLogId: stats.lastSession.id.toString() }
              });
            }
          }}
        >
          <Text className="text-sm font-semibold text-slate-500 mb-2">LAST SESSION</Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-bold text-slate-100">
                {stats.lastSession.workoutName || stats.lastSession.splitName}
              </Text>
              <Text className="text-sm text-slate-400 mt-1">
                {new Date(stats.lastSession.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })} · {stats.lastSession.exercises?.length || 0} exercises
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </View>
        </TouchableOpacity>
      )}

      {/* Most Active Day */}
      {stats.mostActiveDay && (
        <View className="mx-4 mt-4 mb-8 bg-slate-900 rounded-xl p-4 border border-slate-800">
          <Text className="text-sm font-semibold text-slate-500 mb-2">MOST ACTIVE DAY</Text>
          <View className="flex-row items-center">
            <View className="bg-blue-950/40 border border-blue-900/40 p-3 rounded-full mr-3">
              <Ionicons name="calendar" size={20} color="#60A5FA" />
            </View>
            <View>
              <Text className="text-lg font-bold text-slate-100">
                {stats.mostActiveDay}
              </Text>
              <Text className="text-sm text-slate-400">
                {(stats.sessionsByDay[stats.mostActiveDay as keyof typeof stats.sessionsByDay]) || 0} sessions
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
