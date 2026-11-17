import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { splitsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { UpdateSplitRequest } from '@/types';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { localDay } from '@/utils/stretch';

export function useEditSplit(splitId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.splits });
    router.back();
  };
  const onError = (error: unknown) => {
    alert('Error', getErrorMessage(error));
  };

  const mutation = useMutation({
    mutationFn: (data: UpdateSplitRequest) => splitsApi.update(Number(splitId), data),
    onSuccess,
    onError,
  });

  // Today (on this device) becomes the first day of week 1
  const restart = useMutation({
    mutationFn: () => splitsApi.restartMesocycle(Number(splitId), localDay()),
    onSuccess,
    onError,
  });

  const save = (name: string, changes: Omit<UpdateSplitRequest, 'name'> = {}) => {
    if (!name.trim()) {
      alert('Error', 'Please enter a name');
      return;
    }
    mutation.mutate({ ...changes, name: name.trim() });
  };

  return {
    save,
    restartMesocycle: () => restart.mutate(),
    isPending: mutation.isPending || restart.isPending,
  };
}
