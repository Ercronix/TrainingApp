import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { statsApi, trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { DashboardStats, TrainingLog, Weekday } from '@/types';
import { computeTrainingAnalytics } from '@/utils/stats';

const WEEKDAYS: Weekday[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const EMPTY_RANGE = { week: 0, month: 0, year: 0 };

const EMPTY_STATS: DashboardStats = {
  sessions: EMPTY_RANGE,
  volume: EMPTY_RANGE,
  durationSeconds: EMPTY_RANGE,
  averageVolume: EMPTY_RANGE,
  streak: { current: 0, longest: 0, last7Days: [] },
  mostActiveDay: null,
  mostActiveDaySessions: 0,
  lastSession: null,
};

function getTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // The server falls back to its own zone
    return undefined;
  }
}

export function formatDuration(seconds: number): string {
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// Parses a yyyy-MM-dd date as a local calendar day (new Date('yyyy-MM-dd') would be UTC midnight)
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function weekdayName(day: Weekday): string {
  // 2024-01-01 was a Monday
  return new Date(2024, 0, 1 + WEEKDAYS.indexOf(day)).toLocaleDateString(undefined, { weekday: 'long' });
}

export function useDashboard() {
  const query = useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: () => statsApi.get(getTimeZone()),
  });

  // Charts and trends need every session, so they come from the (offline-cached) history
  const history = useQuery<TrainingLog[]>({
    queryKey: ['history'],
    queryFn: trainingLogsApi.getAll,
  });
  const analytics = useMemo(() => computeTrainingAnalytics(history.data ?? []), [history.data]);

  return {
    stats: query.data ?? EMPTY_STATS,
    analytics,
    isLoading: query.isLoading || history.isLoading,
    isRefetching: query.isRefetching || history.isRefetching,
    refetch: () => Promise.all([query.refetch(), history.refetch()]),
  };
}
