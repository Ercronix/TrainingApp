import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { MUTATION_KEYS, UpdateExerciseLogVariables } from '@/services/queryClient';
import { TrainingLog } from '@/types';

/**
 * Updates an exercise log optimistically, so the change shows immediately — also while
 * offline, where the request is paused (and persisted) until the connection returns.
 */
export function useUpdateExerciseLog(trainingLogId: string) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.training(trainingLogId);

  return useMutation<unknown, unknown, UpdateExerciseLogVariables, { previous?: TrainingLog }>({
    mutationKey: MUTATION_KEYS.updateExerciseLog,
    onMutate: async ({ exerciseLogId, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TrainingLog>(queryKey);
      if (previous) {
        const patch = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
        queryClient.setQueryData<TrainingLog>(queryKey, {
          ...previous,
          exercises: previous.exercises.map((e) => (e.id === exerciseLogId ? { ...e, ...patch } : e)),
        });
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      alert('Error', getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
