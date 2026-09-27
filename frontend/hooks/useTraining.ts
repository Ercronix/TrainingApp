import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { CompleteTrainingVariables, MUTATION_KEYS, trainingScope } from '@/services/queryClient';
import { TrainingLog } from '@/types';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';

export function useTraining(trainingLogId: string) {
  const queryClient = useQueryClient();
  const trainingQuery = useQuery({
    queryKey: QUERY_KEYS.training(trainingLogId),
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    refetchInterval: 5000,
  });

  const updateExerciseLog = useUpdateExerciseLog(trainingLogId);

  // Marks the session finished right away, so it also works offline: the request is paused
  // (and persisted) and runs after the session's other pending changes once back online.
  const completeTraining = useMutation<
    TrainingLog, unknown, CompleteTrainingVariables, { previous?: TrainingLog; previousActive?: TrainingLog[] }
  >({
    mutationKey: MUTATION_KEYS.completeTraining,
    scope: trainingScope(trainingLogId),
    onMutate: async ({ completedAtMs }) => {
      const queryKey = QUERY_KEYS.training(trainingLogId);
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.activeTraining });
      const previous = queryClient.getQueryData<TrainingLog>(queryKey);
      const previousActive = queryClient.getQueryData<TrainingLog[]>(QUERY_KEYS.activeTraining);
      if (previous) {
        queryClient.setQueryData<TrainingLog>(queryKey, {
          ...previous, isCompleted: true, completedAt: new Date(completedAtMs).toISOString(),
        });
      }
      if (previousActive) {
        queryClient.setQueryData<TrainingLog[]>(
          QUERY_KEYS.activeTraining, previousActive.filter((t) => t.id !== Number(trainingLogId)),
        );
      }
      return { previous, previousActive };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.training(trainingLogId), context.previous);
      if (context?.previousActive) queryClient.setQueryData(QUERY_KEYS.activeTraining, context.previousActive);
      alert('Error', getErrorMessage(error));
    },
  });

  return {
    training: trainingQuery.data,
    isLoading: trainingQuery.isLoading,
    updateExerciseLog,
    completeTraining,
  };
}
