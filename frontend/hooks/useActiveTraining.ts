import { useQuery } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/store/authStore';

/** The most recently started session that hasn't been completed, if any. */
export function useActiveTraining() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const query = useQuery({
    queryKey: QUERY_KEYS.activeTraining,
    queryFn: trainingLogsApi.getActive,
    enabled: isAuthenticated,
  });

  return { activeTraining: query.data?.[0] ?? null };
}
