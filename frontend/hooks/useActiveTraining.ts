import { useQuery } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { TrainingLog } from '@/types';

// Unfinished sessions older than this were abandoned (left without completing), not in progress
const ACTIVE_WINDOW_MS = 12 * 60 * 60 * 1000;

export function isInProgress(log: TrainingLog): boolean {
  return !log.isCompleted && Date.now() - Date.parse(log.startedAt) < ACTIVE_WINDOW_MS;
}

/** The most recently started session that is still in progress, if any. */
export function useActiveTraining() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const query = useQuery({
    queryKey: QUERY_KEYS.activeTraining,
    queryFn: trainingLogsApi.getActive,
    enabled: isAuthenticated,
  });

  return { activeTraining: query.data?.find(isInProgress) ?? null };
}
