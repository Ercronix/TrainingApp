import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bodyWeightApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import {
  BODY_WEIGHT_SCOPE,
  BodyWeightDeleteVariables,
  BodyWeightUpsertVariables,
  MUTATION_KEYS,
} from '@/services/queryClient';
import { BodyWeightEntry } from '@/types';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { removeEntry, upsertEntry } from '@/utils/bodyWeight';

const EMPTY: BodyWeightEntry[] = [];

/** Every body-weight entry, oldest first. Read-only, e.g. for relative strength. */
export function useBodyWeightEntries() {
  const query = useQuery({
    queryKey: QUERY_KEYS.bodyWeight,
    queryFn: () => bodyWeightApi.getAll(),
  });
  return { entries: query.data ?? EMPTY, query };
}

type Context = { previous?: BodyWeightEntry[] };

/**
 * The body-weight log. Logging a day (which replaces its entry) and deleting one update
 * optimistically and, like a session's sets, survive being offline and an app restart
 * (see services/queryClient.ts).
 */
export function useBodyWeight() {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.bodyWeight;
  const { entries, query } = useBodyWeightEntries();

  const optimistic = <V,>(apply: (entries: BodyWeightEntry[], vars: V) => BodyWeightEntry[]) =>
    async (vars: V): Promise<Context> => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BodyWeightEntry[]>(queryKey);
      queryClient.setQueryData<BodyWeightEntry[]>(queryKey, apply(previous ?? [], vars));
      return { previous };
    };

  const onError = (error: unknown, _vars: unknown, context?: Context) => {
    if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    alert('Error', getErrorMessage(error));
  };

  const upsert = useMutation<unknown, unknown, BodyWeightUpsertVariables, Context>({
    mutationKey: MUTATION_KEYS.bodyWeightUpsert,
    scope: BODY_WEIGHT_SCOPE,
    onMutate: optimistic<BodyWeightUpsertVariables>((list, { date, weight, note }) =>
      upsertEntry(list, { date, weight, note: note?.trim() || null })),
    onError,
  });

  const remove = useMutation<unknown, unknown, BodyWeightDeleteVariables, Context>({
    mutationKey: MUTATION_KEYS.bodyWeightDelete,
    scope: BODY_WEIGHT_SCOPE,
    onMutate: optimistic<BodyWeightDeleteVariables>((list, { date }) => removeEntry(list, date)),
    onError,
  });

  return {
    entries,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    logWeight: (date: string, weight: number, note?: string) =>
      upsert.mutate({ date, weight, note: note?.trim() || undefined }),
    deleteEntry: (date: string) => remove.mutate({ date }),
  };
}
