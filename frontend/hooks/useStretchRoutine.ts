import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stretchApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { StretchItemRequest, StretchRoutine } from '@/types';

/** The daily stretch routine and its stretches. */
export function useStretchRoutine() {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.stretchRoutine;

  const query = useQuery({
    queryKey,
    queryFn: stretchApi.getRoutine,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
  };
  const onError = (error: unknown) => {
    alert('Error', getErrorMessage(error));
  };

  const renameRoutine = useMutation({
    mutationFn: (name: string) => stretchApi.renameRoutine(name),
    onSuccess: (routine) => queryClient.setQueryData(queryKey, routine),
    onError,
  });

  const addItem = useMutation({
    mutationFn: (data: StretchItemRequest) => stretchApi.addItem(data),
    onSettled: invalidate,
    onError,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StretchItemRequest }) => stretchApi.updateItem(id, data),
    onSettled: invalidate,
    onError,
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => stretchApi.deleteItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StretchRoutine>(queryKey);
      if (previous) {
        queryClient.setQueryData<StretchRoutine>(queryKey, { ...previous, items: previous.items.filter((i) => i.id !== id) });
      }
      return { previous };
    },
    onError: (error: unknown, _id, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      onError(error);
    },
    onSettled: invalidate,
  });

  const reorderItems = useMutation({
    mutationFn: (items: { id: number; orderIndex: number }[]) => stretchApi.reorderItems(items),
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StretchRoutine>(queryKey);
      if (previous) {
        const indexMap = new Map(newOrder.map((i) => [i.id, i.orderIndex]));
        queryClient.setQueryData<StretchRoutine>(queryKey, {
          ...previous,
          items: previous.items
            .map((i) => ({ ...i, orderIndex: indexMap.get(i.id) ?? i.orderIndex }))
            .sort((a, b) => a.orderIndex - b.orderIndex),
        });
      }
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      onError(error);
    },
    onSettled: invalidate,
  });

  return {
    routine: query.data,
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    renameRoutine,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
  };
}
