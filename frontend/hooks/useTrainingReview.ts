import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { MUTATION_KEYS, UpdateTrainingReviewVariables, trainingScope } from '@/services/queryClient';
import { TrainingLog } from '@/types';

/**
 * Saves a session's ratings and note optimistically, also offline: the request is paused (and
 * persisted) and runs in the session's scope, so after its completion. The invalidation is in
 * the mutation defaults, so it also runs for a save replayed after an app restart.
 */
export function useTrainingReview(trainingLogId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, UpdateTrainingReviewVariables>({
    mutationKey: MUTATION_KEYS.updateTrainingReview,
    scope: trainingScope(trainingLogId),
    onMutate: async ({ review }) => {
      const queryKey = QUERY_KEYS.training(trainingLogId);
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: ['history'] });
      const id = Number(trainingLogId);
      queryClient.setQueryData<TrainingLog>(queryKey, (previous) => previous && { ...previous, ...review });
      queryClient.setQueryData<TrainingLog[]>(['history'], (logs) =>
        logs?.map((log) => (log.id === id ? { ...log, ...review } : log)));
    },
    // No rollback: saves replace the whole review and may be queued behind each other, so the
    // refetch after it settles shows what the server has
    onError: (error) => alert('Error', getErrorMessage(error)),
  });
}
