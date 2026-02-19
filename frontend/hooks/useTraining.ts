import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useTraining(trainingLogId: string) {
  const queryClient = useQueryClient();

  const trainingQuery = useQuery({
    queryKey: QUERY_KEYS.training(trainingLogId),
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    refetchInterval: 5000,
  });

  const updateExerciseLog = useMutation({
    mutationFn: ({ exerciseLogId, data }: { exerciseLogId: number; data: any }) =>
      trainingLogsApi.updateExerciseLog(exerciseLogId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training(trainingLogId) });
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const completeTraining = useMutation({
    mutationFn: () => trainingLogsApi.complete(Number(trainingLogId)),
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