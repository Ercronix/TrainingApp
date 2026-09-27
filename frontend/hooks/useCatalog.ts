import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';

const DAY_MS = 86_400_000;

// The catalog only changes with a server release, so it is fetched at most once a day
export function useCatalog() {
  const query = useQuery({
    queryKey: QUERY_KEYS.catalog,
    queryFn: catalogApi.getAll,
    staleTime: DAY_MS,
  });
  return { catalog: query.data ?? [], isLoading: query.isLoading };
}
