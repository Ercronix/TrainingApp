import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { UpdateLibraryExerciseRequest } from '@/types';

export function useLibrary() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.library,
    queryFn: libraryApi.getAll,
  });

  // Library details show up on every workout and session that uses the entry
  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.library });
    void queryClient.invalidateQueries({ queryKey: ['exercises'] });
    void queryClient.invalidateQueries({ queryKey: ['training'] });
  };

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLibraryExerciseRequest }) => libraryApi.update(id, data),
    onSuccess: invalidateAll,
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (id: number) => libraryApi.delete(id),
    onSuccess: invalidateAll,
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  return {
    library: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    updateEntry,
    deleteEntry,
  };
}
