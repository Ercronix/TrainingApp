import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stretchApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { MUTATION_KEYS, STRETCH_SCOPE, StretchCheckInVariables } from '@/services/queryClient';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { localDay, stretchStreak } from '@/utils/stretch';

/**
 * The days the user stretched. Checking a day in or out updates optimistically and, like a
 * session's sets, survives being offline and an app restart (see services/queryClient.ts).
 */
export function useStretchCheckIns() {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.stretchCheckIns;

  const query = useQuery({
    queryKey,
    queryFn: stretchApi.getCheckIns,
  });

  const optimistic = (apply: (days: string[], day: string) => string[]) =>
    async ({ day }: StretchCheckInVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey);
      queryClient.setQueryData<string[]>(queryKey, apply(previous ?? [], day));
      return { previous };
    };

  const onError = (error: unknown, _vars: StretchCheckInVariables, context?: { previous?: string[] }) => {
    if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    alert('Error', getErrorMessage(error));
  };

  const checkIn = useMutation<unknown, unknown, StretchCheckInVariables, { previous?: string[] }>({
    mutationKey: MUTATION_KEYS.stretchCheckIn,
    scope: STRETCH_SCOPE,
    onMutate: optimistic((days, day) => (days.includes(day) ? days : [...days, day].sort())),
    onError,
  });

  const undoCheckIn = useMutation<unknown, unknown, StretchCheckInVariables, { previous?: string[] }>({
    mutationKey: MUTATION_KEYS.stretchUndoCheckIn,
    scope: STRETCH_SCOPE,
    onMutate: optimistic((days, day) => days.filter((d) => d !== day)),
    onError,
  });

  const days = new Set(query.data ?? []);
  const today = localDay();

  return {
    days,
    doneToday: days.has(today),
    streak: stretchStreak(days),
    isLoading: query.isLoading,
    refetch: query.refetch,
    checkInToday: () => checkIn.mutate({ day: localDay() }),
    undoToday: () => undoCheckIn.mutate({ day: localDay() }),
  };
}
