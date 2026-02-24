import { useQuery } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { TrainingLog, ExerciseLog, DashboardStats } from '@/types';

function formatTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function calculateStreak(logs: TrainingLog[]): { current: number; longest: number; last7Days: boolean[] } {
  if (!logs.length) return { current: 0, longest: 0, last7Days: Array(7).fill(false) };

  // Get unique dates with sessions
  const sessionDates = new Set(
    logs
      .filter(log => log.isCompleted)
      .map(log => new Date(log.startedAt).toDateString())
  );

  // Check last 7 days
  const last7Days: boolean[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(sessionDates.has(date.toDateString()));
  }

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date();
  
  while (true) {
    const dateString = checkDate.toDateString();
    if (sessionDates.has(dateString)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const sortedDates = Array.from(sessionDates).sort();
  
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { current: currentStreak, longest: longestStreak, last7Days };
}

function calculateVolume(exercises?: ExerciseLog[]): number {
  if (!exercises) return 0;
  
  return exercises.reduce((total, ex) => {
    if (ex.completed && ex.weightUsed && ex.setsCompleted && ex.repsCompleted) {
      return total + (ex.weightUsed * ex.setsCompleted * ex.repsCompleted);
    }
    return total;
  }, 0);
}

function calculateTimeRange(date: Date, range: 'week' | 'month' | 'year'): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  switch (range) {
    case 'week': return diffDays <= 7;
    case 'month': return diffDays <= 30;
    case 'year': return diffDays <= 365;
  }
}

function getDayName(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long' });
}

export function useDashboard() {
  const query = useQuery<TrainingLog[]>({
    queryKey: ['history'],
    queryFn: trainingLogsApi.getAll,
  });

  const stats: DashboardStats = query.data 
    ? calculateStats(query.data) 
    : {
        streak: { current: 0, longest: 0, last7Days: Array(7).fill(false) },
        sessions: { week: 0, month: 0, year: 0 },
        volume: { week: 0, month: 0, year: 0 },
        time: { week: '0m', month: '0m', year: '0m' },
        averageVolume: 0,
        lastSession: null,
        mostActiveDay: 'Monday',
        sessionsByDay: {},
      };

  return {
    stats,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
}

function calculateStats(logs: TrainingLog[]): DashboardStats {
  const completedLogs = logs.filter(log => log.isCompleted);
  
  // Calculate streak
  const streak = calculateStreak(logs);
  
  // Calculate sessions per time range
  const sessions = {
    week: completedLogs.filter(log => calculateTimeRange(new Date(log.startedAt), 'week')).length,
    month: completedLogs.filter(log => calculateTimeRange(new Date(log.startedAt), 'month')).length,
    year: completedLogs.length,
  };
  
  // Calculate volume per time range
  const volume = {
    week: completedLogs
      .filter(log => calculateTimeRange(new Date(log.startedAt), 'week'))
      .reduce((sum, log) => sum + calculateVolume(log.exercises), 0),
    month: completedLogs
      .filter(log => calculateTimeRange(new Date(log.startedAt), 'month'))
      .reduce((sum, log) => sum + calculateVolume(log.exercises), 0),
    year: completedLogs.reduce((sum, log) => sum + calculateVolume(log.exercises), 0),
  };
  
  // Calculate total time trained (in minutes)
  const time = {
    week: formatTime(
      completedLogs
        .filter(log => calculateTimeRange(new Date(log.startedAt), 'week'))
        .reduce((sum, log) => sum + (log.durationSeconds || 0) / 60, 0)
    ),
    month: formatTime(
      completedLogs
        .filter(log => calculateTimeRange(new Date(log.startedAt), 'month'))
        .reduce((sum, log) => sum + (log.durationSeconds || 0) / 60, 0)
    ),
    year: formatTime(
      completedLogs.reduce((sum, log) => sum + (log.durationSeconds || 0) / 60, 0)
    ),
  };
  
  // Average volume per session
  const averageVolume = sessions.year > 0 
    ? Math.round(volume.year / sessions.year) 
    : 0;
  
  // Most active day
  const dayCounts: Record<string, number> = {};
  completedLogs.forEach(log => {
    const day = getDayName(new Date(log.startedAt));
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  const mostActiveDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const mostActiveDay = mostActiveDayEntry ? mostActiveDayEntry[0] : 'Monday';
  
  return {
    streak,
    sessions,
    volume: {
      week: Math.round(volume.week),
      month: Math.round(volume.month),
      year: Math.round(volume.year),
    },
    time,
    averageVolume,
    lastSession: completedLogs[0] || null,
    mostActiveDay,
    sessionsByDay: dayCounts,
  };
}
