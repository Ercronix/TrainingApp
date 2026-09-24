import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';

export function useTraining(trainingLogId: string) {
  const queryClient = useQueryClient();
  const trainingQuery = useQuery({
    queryKey: QUERY_KEYS.training(trainingLogId),
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    refetchInterval: 5000,
  });

  const updateExerciseLog = useUpdateExerciseLog(trainingLogId);

  const completeTraining = useMutation({
    mutationFn: () => trainingLogsApi.complete(Number(trainingLogId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
    },
    onError: (error: unknown) => {
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