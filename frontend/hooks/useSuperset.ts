import { useQuery } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useSetDraftStore } from '@/store/setDraftStore';
import { supersetOf, supersetPositions } from '@/utils/supersets';
import { TrainingLog } from '@/types';

/**
 * The superset (or circuit) a session's exercise is in, null when it's in none: its members in
 * order, the exercise's place among them, and the members' drafts (to count their sets).
 *
 * Read from the cached session, so it works offline and sends no request of its own (the
 * training screen underneath keeps the session fresh); it follows changes to the cache.
 */
export function useSuperset(trainingLogId: string, exerciseLogId: string) {
  const { data: training } = useQuery<TrainingLog>({
    queryKey: QUERY_KEYS.training(trainingLogId),
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    enabled: false,
  });
  const drafts = useSetDraftStore((s) => s.drafts);
  const exercises = training?.exercises ?? [];
  const index = exercises.findIndex((e) => e.id === Number(exerciseLogId));
  const position = index < 0 ? null : supersetPositions(exercises)[index];
  const members = index < 0 ? null : supersetOf(exercises, index);
  if (!position || !members) return null;
  return { members, position, drafts };
}
