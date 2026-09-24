import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';
import { alert } from '@/utils/confirm';
import { TrainingLog } from '@/types';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useHistory() {
  const queryClient = useQueryClient();

  const query = useQuery<TrainingLog[]>({
    queryKey: ['history'],
    queryFn: trainingLogsApi.getAll,
  });

  const deleteLog = useMutation({
    mutationFn: (id: number) => trainingLogsApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeTraining });
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    deleteLog,
  };
}
