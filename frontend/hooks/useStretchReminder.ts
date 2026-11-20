import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stretchApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { StretchReminderRequest } from '@/types';

/** The daily stretch reminder the server sends through ntfy. */
export function useStretchReminder() {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.stretchReminder;

  const query = useQuery({
    queryKey,
    queryFn: stretchApi.getReminder,
  });

  const onError = (error: unknown) => {
    alert('Error', getErrorMessage(error));
  };

  const updateReminder = useMutation({
    mutationFn: (data: StretchReminderRequest) => stretchApi.updateReminder(data),
    onSuccess: (reminder) => queryClient.setQueryData(queryKey, reminder),
    onError,
  });

  const sendTest = useMutation({
    mutationFn: stretchApi.sendTestReminder,
    onError,
  });

  return {
    reminder: query.data,
    isLoading: query.isLoading,
    updateReminder,
    sendTest,
  };
}
