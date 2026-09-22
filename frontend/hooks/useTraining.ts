import { useQuery, useMutation } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';

export function useTraining(trainingLogId: string) {
  const trainingQuery = useQuery({
    queryKey: QUERY_KEYS.training(trainingLogId),
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    refetchInterval: 5000,
  });

  const updateExerciseLog = useUpdateExerciseLog(trainingLogId);

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