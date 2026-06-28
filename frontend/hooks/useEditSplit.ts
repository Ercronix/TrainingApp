import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { splitsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';

export function useEditSplit(splitId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (data: { name: string; currentBlock?: number }) =>
      splitsApi.update(Number(splitId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.splits });
      router.back();
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const save = (name: string, currentBlock?: number) => {
    if (!name.trim()) {
      alert('Error', 'Please enter a name');
      return;
    }
    mutation.mutate({ name: name.trim(), currentBlock });
  };

  return { save, isPending: mutation.isPending };
}